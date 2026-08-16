// ==UserScript==
// @name			Многоцветное автовыделение 
// @description		Кнопка позволяет "подсветить" на странице несколько слов одновременно разными цветами.
// @compatibility	Firefox 152 
// @version			1.0.1 Изменён способ вывода иконок в меню кнопки.
// @version			1.0.0 (релиз)
// @homepage		https://github.com/KotDaVinci-1/FirefoxChromeScripts
// ==/UserScript==

if (!ChromeUtils.domProcessChild.childID) {
	let { CustomizableUI } = ChromeUtils.importESModule("moz-src:///browser/components/customizableui/CustomizableUI.sys.mjs");

	const ID = "uc_text_highlighter";
	const IMG_ICON = "data:image/svg+xml,<svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path fill='context-fill' transform='rotate(14) translate(2.5 -2.95)' d='M10.189 0a3.784 3.784 0 0 0-3.055 5.93l1.741 2.562a1.855 1.855 0 0 0 3.334-.13l1.454-2.929h-.006A3.784 3.784 0 0 0 10.189 0zM19.4 4.7a4.2 4.2 0 0 0-1.662.306 4.23 4.23 0 0 0-1.817 1.396l-2.214 2.837c-.025.032-.05.063-.074.096l-.01.012a2.088 2.088 0 0 0 1.51 3.306l3.614.536-.003-.007a4.259 4.259 0 0 0 4.532-5.807 4.264 4.264 0 0 0-3.875-2.675zM3.3 6.5a3.60021,3.60021 0 0 0 -3.46551,2.80574a3.59678,3.59678 0 0 0 4.50882,4.36043l2.96783,-0.84469a1.76358,1.76358 0 0 0 0.84697,-3.05116l-2.3423,-2.27039l0,0.00571a3.57281,3.57281 0 0 0 -2.51581,-1.00564zM13.9 13.959a1.886 1.886 0 0 0-1.8 2.233l.4 3.263.005-.003a3.846 3.9 0 0 0 6.134 2.574 3.9 3.84 0 0 0-.9-6.645l-2.85-1.2a1.9 1.8 0 0 0-.9-.22zm-5.55.08c-.377 0-.75.104-1.076.3L4.06 16.018l.006.003a4.21 4.21 0 0 0-1.593 1.485 4.24 4.24 0 0 0 1.342 5.843 4.239 4.239 0 0 0 5.845-1.332 4.21 4.21 0 0 0 .647-2.172l.108-3.45a2.079 2.079 0 0 0-2.062-2.356z'></path></svg>";

	const COLORS = ["#F8F", "#0EF", "#4F5", "#8bF", "orange", "#F66"];
	const PREF_PREFIX = "uc.highlighter.";

	const MAX_LENGTH = 50;

	const initPrefs = () => {
		if (!Services.prefs.prefHasUserValue(PREF_PREFIX + "index")) {
			Services.prefs.setIntPref(PREF_PREFIX + "index", 1);
		}
		// Независимые настройки поиска (по умолчанию обе false)
		if (!Services.prefs.prefHasUserValue(PREF_PREFIX + "matchCase")) {
			Services.prefs.setBoolPref(PREF_PREFIX + "matchCase", false);
		}
		if (!Services.prefs.prefHasUserValue(PREF_PREFIX + "matchDiacritics")) {
			Services.prefs.setBoolPref(PREF_PREFIX + "matchDiacritics", false);
		}

		const defaults = ["сюда", "нужно", "вписать", "всякие", "разные", "слова"];
		for (let i = 1; i <= 6; i++) {
			let prefName = `${PREF_PREFIX}text.${i}`;
			if (!Services.prefs.prefHasUserValue(prefName)) {
				Services.prefs.setStringPref(prefName, defaults[i-1]);
			}
		}
	};
	initPrefs();

	const getHighlightsFromPrefs = () => {
		let highlights = [];
		for (let i = 1; i <= 6; i++) {
			try {
				let text = Services.prefs.getStringPref(`${PREF_PREFIX}text.${i}`);
				if (text && text.trim() !== "") {
					highlights.push({ text: text, color: COLORS[i-1] });
				}
			} catch (e) {
				console.error(`[UC] Ошибка чтения настройки text.${i}:`, e);
			}
		}
		return highlights;
	};

	const showAlert = (title, body) => {
		try {
			const alertsService = Components.classes["@mozilla.org/alerts-service;1"]
									.getService(Components.interfaces.nsIAlertsService);

			const AlertNotification = Components.Constructor(
				"@mozilla.org/alert-notification;1",
				"nsIAlertNotification",
				"initWithObject"
			);

			let alert = new AlertNotification({
				imageURL: IMG_ICON,
				title: title,
				text: body,
				textClickable: false
			});

			alertsService.showAlert(alert, null);
		} catch (e) {}
	};

	const updateBadge = () => {
		try {
			let currentIndex = Services.prefs.getIntPref(PREF_PREFIX + "index");
			let instances = CustomizableUI.getWidget(ID).instances;
			instances?.forEach?.(instance => {
				let node = instance?.node;
				if (node) {
					let badgeLabel = node.querySelector(".toolbarbutton-badge");
					if (badgeLabel) {
						badgeLabel.setAttribute("value", currentIndex);
						badgeLabel.textContent = currentIndex;

						let color = COLORS[currentIndex - 1] || "gray";
						badgeLabel.style.setProperty("--active-slot-color", color);
					}
				}
			});
		} catch (ex) {}
	};

	const addTextToNextSlot = (rawText) => {
		if (!rawText || rawText.trim() === "") return false;

		let rawTrimmed = rawText.trim();
		let wasTruncated = rawTrimmed.includes('\n'); 
		let textToSave = rawTrimmed.split(/\r?\n/)[0].trim();

		if (textToSave.length > MAX_LENGTH) {
			showAlert("Многоцветное автовыделение", `❌ Отмена: текст слишком длинный (${textToSave.length} симв.).\nМаксимальная длина: ${MAX_LENGTH} симв.`);
			return false;
		}

		try {
			let currentIndex = Services.prefs.getIntPref(PREF_PREFIX + "index");
			if (currentIndex < 1 || currentIndex > 6) currentIndex = 1;

			let oldText = "";
			try { oldText = Services.prefs.getStringPref(`${PREF_PREFIX}text.${currentIndex}`); } catch(e){}
			let action = oldText.trim() === "" ? "добавлен в слот" : "изменён в слоте";

			Services.prefs.setStringPref(`${PREF_PREFIX}text.${currentIndex}`, textToSave);

			let nextIndex = (currentIndex % 6) + 1;
			Services.prefs.setIntPref(PREF_PREFIX + "index", nextIndex);
			updateBadge();

			let warning = wasTruncated ? "⚠️ Текст обрезан по переносу\n" : "";
			showAlert("Многоцветное автовыделение", `${warning}Текст ${action} ${currentIndex}:\n«${textToSave}»`);
			return true;

		} catch (e) {
			return false;
		}
	};

	const updateAllInstances = (isActive) => {
		try {
			let instances = CustomizableUI.getWidget(ID).instances;
			instances?.forEach?.(instance => {
				let node = instance?.node;
				if (node) {
					if (isActive) node.setAttribute("data-highlighted", "true");
					else node.removeAttribute("data-highlighted");
				}
			});
		} catch (ex) {}
	};

	CustomizableUI.createWidget({
		id: ID,
		label: "Многоцветное автовыделение",
		localized: false,
		type: "custom",
		defaultArea: CustomizableUI.AREA_NAVBAR,

		onBuild: function(doc) {
			if (!doc.getElementById("uc_text_highlighter-styles")) {
				let style = doc.createElementNS("http://www.w3.org/1999/xhtml", "style");
				style.id = "uc_text_highlighter-styles";
				style.textContent = `
					#uc_text_highlighter .toolbarbutton-badge {
						background-color: var(--active-slot-color, gray) !important;
						color: black !important;
						padding: 0 !important;
						margin-inline-end: -5px !important;
						margin-top: -5px !important;
						min-width: 9px !important;
					}

					#uc_text_highlighter[data-highlighted="true"] .toolbarbutton-icon {
						animation: uc-highligh 6s infinite !important;
						filter: drop-shadow(0 0 .5px black) drop-shadow(.5px .5px .5px black);
					}

					@keyframes uc-highligh {
					  0%, 2%, 98%, 100% { fill: rgb(255,228,0);}
					  23%, 27% { fill: rgb(0, 255, 0);}
					  48%, 52% { fill: rgb(12, 208, 255);}
					  73%, 77% { fill: rgb(255, 96, 252);}
					}
					/* Иконка */
					#uc_text_highlighter menuitem.menuitem-iconic[data-slot] .menu-icon {
						-moz-context-properties: fill !important;
						fill: var(--slot-color) !important;
						content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Ccircle cx='8' cy='8' r='7' fill='context-fill' stroke='rgba(0,0,0,0.5)' stroke-width='1'/%3E%3C/svg%3E") !important;
					}
					#uc_text_highlighter menuitem.menuitem-iconic[data-active] .menu-icon {
						content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Cpolygon points='1,1 1,15 15,8' fill='context-fill' stroke='rgba(0,0,0,0.5)' stroke-width='1'/%3E%3C/svg%3E") !important;
					}
				`;
				doc.documentElement.appendChild(style);
			}

			let btn = doc.createXULElement("toolbarbutton");
			btn.id = "uc_text_highlighter";
			btn.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
			btn.setAttribute("label", "Highlighter");
			btn.setAttribute("tooltiptext", "Многоцветное автовыделение\n\n=КНОПКА=\nЛКМ: ВКЛ/ВЫКЛ\nСКМ: Добавить текст в активный слот\nПКМ: Меню слотов и настроек\nСкролл ⇅: Смена активного слота\n\n=СЛОТЫ=\nЛКМ: Ручной ввод текста в слот\nСКМ: Копировать текст в буфер обмена");

			let stack = doc.createXULElement("stack");
			stack.setAttribute("class", "toolbarbutton-badge-stack");

			let icon = doc.createXULElement("image");
			icon.setAttribute("class", "toolbarbutton-icon");
			icon.setAttribute("src", IMG_ICON);

			let badge = doc.createElementNS("http://www.w3.org/1999/xhtml", "label");
			badge.setAttribute("class", "toolbarbutton-badge");

			let initialIndex = 1;
			try { initialIndex = Services.prefs.getIntPref(PREF_PREFIX + "index"); } catch(e){}
			badge.setAttribute("value", initialIndex); 
			badge.textContent = initialIndex; 

			let initialColor = COLORS[initialIndex - 1] || "gray";
			badge.style.setProperty("--active-slot-color", initialColor);

			stack.appendChild(icon);
			stack.appendChild(badge);
			btn.appendChild(stack);

			const win = doc.defaultView;
			const popup = doc.createXULElement("menupopup");
			popup.id = ID + "-popup";
			btn.appendChild(popup);

			// --- ИНЖЕКТИРУЕМЫЕ СКРИПТЫ ---
			const highlightScript = function(args) {
				if (!window.CSS || !CSS.highlights) return;
				
				const highlightsArray = args.highlights;
				const matchCase = args.matchCase;
				const matchDiacritics = args.matchDiacritics;

				for (let i = 0; i < 6; i++) {
					CSS.highlights.delete(`uc-highlight-${i}`);
				}

				let style = document.getElementById('uc-highlight-api-styles');
				
				if (!highlightsArray || !highlightsArray.length) {
					if (style) style.remove();
					let canvas = document.getElementById('uc-highlight-scrollbar-markers');
					if (canvas) canvas.remove();
					return;
				}

				if (!style) {
					style = document.createElement('style');
					style.id = 'uc-highlight-api-styles';
					document.head.appendChild(style);
				}
				style.textContent = highlightsArray.map((item, i) => 
					`::highlight(uc-highlight-${i}) { background-color: ${item.color} !important; color: black !important; }`
				).join(' ');

				const flatten = (str) => {
					let res = str;
					if (!matchDiacritics) res = res.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
					if (!matchCase) res = res.toLowerCase();
					return res;
				};

				const getOrigOffset = (origStr, targetFlatOffset) => {
					if (matchDiacritics && matchCase) return targetFlatOffset; 
					let flatIndex = 0;
					let origIndex = 0;
					for (let char of origStr) {
						if (flatIndex >= targetFlatOffset) break;
						flatIndex += flatten(char).length;
						origIndex += char.length; 
					}
					return origIndex;
				};

				const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
				const nodes = [];
				let text = "";

				let n;
				while ((n = walker.nextNode())) {
					const p = n.parentNode;
					if (p && p.nodeName.match(/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/i)) continue;
					
					let origStr = n.nodeValue;
					let flatStr = flatten(origStr);
					
					nodes.push({ 
						node: n, 
						start: text.length, 
						end: text.length + flatStr.length,
						origText: origStr 
					});
					text += flatStr;
				}

				let allMarkers = [];  // Массив для сбора координат маркеров скроллбара
				let savedRanges = []; // Массив для "живых" ссылок на DOM

				highlightsArray.forEach((item, index) => {
					let searchStr = flatten(item.text);
					if (!searchStr) return;
					
					let matchIdx = -1;
					let startIndex = 0;
					let ranges = [];
					let nodeIdx = 0;

					while ((matchIdx = text.indexOf(searchStr, startIndex)) !== -1) {
						let matchEnd = matchIdx + searchStr.length;
						startIndex = matchEnd;

						while (nodeIdx < nodes.length && nodes[nodeIdx].end <= matchIdx) {
							nodeIdx++;
						}
						let startNodeData = nodes[nodeIdx];

						let endNodeIdx = nodeIdx;
						while (endNodeIdx < nodes.length && nodes[endNodeIdx].end < matchEnd) {
							endNodeIdx++;
						}
						let endNodeData = nodes[endNodeIdx];

						if (startNodeData && endNodeData) {
							try {
								let range = new Range();
								let startOffset = getOrigOffset(startNodeData.origText, matchIdx - startNodeData.start);
								let endOffset = getOrigOffset(endNodeData.origText, matchEnd - endNodeData.start);

								range.setStart(startNodeData.node, startOffset);
								range.setEnd(endNodeData.node, endOffset);
								ranges.push(range);
								// Сохранение ссылки на Range и его цвет для обновления при ресайзе
								savedRanges.push({ range: range, color: item.color });
							} catch(e) {}
						}
					}

					if (ranges.length) {
						CSS.highlights.set(`uc-highlight-${index}`, new Highlight(...ranges));
						// Сбор координат для отрисовки маркеров на скроллбаре
						ranges.forEach(range => {
							let rects = range.getClientRects();
							if (rects.length > 0) {
								let absoluteY = rects[0].top + window.scrollY;
								allMarkers.push({ y: absoluteY, color: item.color });
							}
						});
					}
				});

				// --- ЛОГИКА ОТРИСОВКИ МАРКЕРОВ НА СКРОЛЛБАРЕ ---
				const drawCanvasMarkers = (markers) => {
					let canvas = document.getElementById('uc-highlight-scrollbar-markers');

					const chromeDPR = args.chromeDPR || 1;
					const currentDPR = window.devicePixelRatio || 1;
					const pageZoom = currentDPR / chromeDPR;

					if (!canvas) {
						canvas = document.createElement('canvas');
						canvas.id = 'uc-highlight-scrollbar-markers';
						// Стиль маркеров
						canvas.style.cssText = 'position: fixed; top: 0; right: 0; height: 100vh; pointer-events: none; z-index: 2147483647; opacity: 0.8;';
						document.documentElement.appendChild(canvas);
					}

					canvas.style.width = (14 / pageZoom) + 'px';

					const winHeight = window.innerHeight;
					const docHeight = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0, winHeight);
					// Внутреннее разрешение холста = физические пиксели окна монитора
					canvas.width = Math.round(14 * chromeDPR);
					const canvasPhysicalHeight = Math.round(winHeight * currentDPR);
					canvas.height = canvasPhysicalHeight;

					let ctx = canvas.getContext('2d');
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					// Перевод отступов в физические пиксели экрана.
					const topOffsetPhysical = Math.round(18 * chromeDPR);
					const bottomOffsetPhysical = Math.round(15 * chromeDPR);
					// Реальная высота зоны для маркеров (в физических пикселях)
					const trackHeightPhysical = canvasPhysicalHeight - topOffsetPhysical - bottomOffsetPhysical;
					const rectHeight = Math.max(1, Math.round(3 * chromeDPR)); 

					markers.forEach(marker => {
						// Расчёт чистого процента прокрутки документа (от 0.0 до 1.0)
						let scrollPercent = marker.y / docHeight;
						// Расчёт идеального центра маркера на экране
						let markerCenterY = topOffsetPhysical + (scrollPercent * trackHeightPhysical);
						// Расчёт половины толщины маркера и ЖЕСТКОЕ округление до целого пикселя
						let drawY = Math.round(markerCenterY - (rectHeight / 2));

						ctx.fillStyle = marker.color;
						ctx.fillRect(0, drawY, canvas.width, rectHeight); 
					});
				};

				// Проверка наличия нативной прокрутки:
				const scrollHeight = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
				const clientHeight = document.documentElement.clientHeight;

				const hasVerticalScrollbar = (window.scrollMaxY !== undefined && window.scrollMaxY > 0) || (scrollHeight > clientHeight);

				if (allMarkers.length > 0 && hasVerticalScrollbar) {
					drawCanvasMarkers(allMarkers);
					window._ucHighlightSavedRanges = savedRanges; 

					if (!window._ucHighlightResizeBound) {
						let resizeTimeout;
						window.addEventListener('resize', () => {
							clearTimeout(resizeTimeout);
							resizeTimeout = setTimeout(() => {
								if (window._ucHighlightSavedRanges && document.getElementById('uc-highlight-scrollbar-markers')) {
									let updatedMarkers = [];
									window._ucHighlightSavedRanges.forEach(item => {
										let rects = item.range.getClientRects();
										if (rects.length > 0) {
											updatedMarkers.push({ y: rects[0].top + window.scrollY, color: item.color });
										}
									});
									const newScrollHeight = Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0);
									const newHasScroll = (window.scrollMaxY !== undefined && window.scrollMaxY > 0) || (newScrollHeight > document.documentElement.clientHeight);

									if (newHasScroll) drawCanvasMarkers(updatedMarkers);
									else document.getElementById('uc-highlight-scrollbar-markers').remove();
								}
							}, 150);
						});
						window._ucHighlightResizeBound = true;
					}
				} else {
					let canvas = document.getElementById('uc-highlight-scrollbar-markers');
					if (canvas) canvas.remove();
				}
			};

			const clearScript = function() {
				if (window.CSS && CSS.highlights) {
					CSS.highlights.clear();
				}
				let style = document.getElementById('uc-highlight-api-styles');
				if (style) style.remove();

				let canvas = document.getElementById('uc-highlight-scrollbar-markers');
				if (canvas) canvas.remove();
				window._ucHighlightSavedRanges = null;
			};

			// --- ГЛОБАЛЬНЫЕ ОБРАБОТЧИКИ СОБЫТИЙ ---
			const isInjectable = (tab, browser) => {
				if (!browser || !browser.currentURI) return false;
				if (tab && tab.hasAttribute("pending")) return false; // Игнор спящих вкладок

				let scheme = browser.currentURI.scheme;
				return ["http", "https", "file"].includes(scheme);
			};

			const injectHighlightToActiveTab = () => {
				let currentTab = win.gBrowser.selectedTab;
				let browser = win.gBrowser.selectedBrowser;

				if (!isInjectable(currentTab, browser)) return;

				const currentHighlights = getHighlightsFromPrefs();

				let matchCase = false, matchDiacritics = false;
				try { matchCase = Services.prefs.getBoolPref(PREF_PREFIX + "matchCase"); } catch(e){}
				try { matchDiacritics = Services.prefs.getBoolPref(PREF_PREFIX + "matchDiacritics"); } catch(e){}

				let args = { 
					highlights: currentHighlights, 
					matchCase: matchCase, 
					matchDiacritics: matchDiacritics,
					chromeDPR: win.devicePixelRatio // Эталонный масштаб системы
				};

				let codeToInject = `(${highlightScript.toString()})(${JSON.stringify(args)});`;

				try {
					win.gBrowser.fixupAndLoadURIString("javascript:" + encodeURIComponent(codeToInject), { 
						triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() 
					});
				} catch(e) {
				}
			};

			const onTabSelect = () => {
				injectHighlightToActiveTab();
			};

			const progressListener = {
				onStateChange(browser, webProgress, request, aStateFlags, aStatus) {
					if (!webProgress.isTopLevel) return;
					const STATE_STOP = Components.interfaces.nsIWebProgressListener.STATE_STOP;
					if (aStateFlags & STATE_STOP) {
						if (browser === win.gBrowser.selectedBrowser) {
							win.setTimeout(injectHighlightToActiveTab, 150);
						}
					}
				},
				onLocationChange(browser, webProgress, request, location, flags) {
					if (!webProgress.isTopLevel) return;
					if (browser === win.gBrowser.selectedBrowser) {
						win.setTimeout(injectHighlightToActiveTab, 500);
					}
				}
			};

			// --- ЛОГИКА КНОПКИ ---
			btn.addEventListener("click", async (e) => {
				if (e.target.closest("menupopup")) return; 
				if (!win.gBrowser) return;

				const isActive = btn.getAttribute("data-highlighted") === "true";

				if (e.button === 0) {
					if (isActive) {
						updateAllInstances(false);
						win.gBrowser.tabContainer.removeEventListener("TabSelect", onTabSelect);
						win.gBrowser.removeTabsProgressListener(progressListener);

						let codeToInject = `(${clearScript.toString()})();`;
						win.gBrowser.fixupAndLoadURIString("javascript:" + encodeURIComponent(codeToInject), { 
							triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() 
						});

						let frameScriptCode = `
							(function() {
								try {
									if (typeof content !== "undefined" && content.document) {
										if (content.CSS && content.CSS.highlights) {
											content.CSS.highlights.clear();
										}
										let style = content.document.getElementById('uc-highlight-api-styles');
										if (style) style.remove();
										
										let canvas = content.document.getElementById('uc-highlight-scrollbar-markers');
										if (canvas) canvas.remove();
										content.window._ucHighlightSavedRanges = null;
									}
								} catch(e) {}
							})();
						`;
						let scriptURI = "data:application/javascript," + encodeURIComponent(frameScriptCode);
						let allTabs = win.gBrowser.tabs;
						let currentTab = win.gBrowser.selectedTab;

						for (let tab of allTabs) {
							if (tab !== currentTab && !tab.hasAttribute("pending")) {
								try { tab.linkedBrowser.messageManager.loadFrameScript(scriptURI, false); } 
								catch (err) {}
							}
						}
					} else {
						updateAllInstances(true);
						injectHighlightToActiveTab();
						win.gBrowser.tabContainer.addEventListener("TabSelect", onTabSelect);
						win.gBrowser.addTabsProgressListener(progressListener);
					}
				}

				if (e.button === 1) {
					e.preventDefault();
					let browser = win.gBrowser.selectedBrowser;
					let selectedText = "";

					try {
						selectedText = await new Promise(resolve => {
							let mm = browser.messageManager;
							let msgName = "UC-Highlighter:GetSelection-" + Date.now();
							let listener = (msg) => {
								mm.removeMessageListener(msgName, listener); 
								resolve(msg.data);
							};
							mm.addMessageListener(msgName, listener);

							let frameScript = `
								(function() {
									let text = "";
									try {
										if (typeof content !== "undefined") {
											text = content.getSelection().toString();
										}
									} catch(e) {}
									sendAsyncMessage("${msgName}", text);
								})();
							`;
							let scriptURI = "data:application/javascript," + encodeURIComponent(frameScript);
							mm.loadFrameScript(scriptURI, false);
						});
					} catch (err) {}

					if (selectedText) {
						if (addTextToNextSlot(selectedText)) {
							if (isActive) injectHighlightToActiveTab();
						}
					}
				}
			});

			// --- ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ДЛЯ ГЕНЕРАЦИИ ЧЕКБОКСОВ ---
			const createPrefCheckbox = (label, prefSuffix) => {
				let prefName = PREF_PREFIX + prefSuffix;
				let item = doc.createXULElement("menuitem");
				item.setAttribute("type", "checkbox");
				item.setAttribute("label", label);
				item.setAttribute("closemenu", "none"); 
				item.setAttribute("image", "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLz4=");

				let isChecked = false;
				try { isChecked = Services.prefs.getBoolPref(prefName); } catch(e) {}
				item.toggleAttribute("checked", isChecked);

				item.addEventListener("command", (e) => {
					// Текущий статус напрямую из about:config
					let currentState = false;
					try { currentState = Services.prefs.getBoolPref(prefName); } catch(e) {}

					let newState = !currentState;
					Services.prefs.setBoolPref(prefName, newState);
					// Синхронизируем DOM
					item.toggleAttribute("checked", newState);
					// Если нужна реакция в интерфейсе:
					if (btn.getAttribute("data-highlighted") === "true") {
						injectHighlightToActiveTab(); 
					}
				});
				return item;
			};

			btn.addEventListener("contextmenu", (e) => {
				if (e.target.closest("menupopup")) return; 

				e.preventDefault();
				e.stopPropagation();

				while(popup.firstChild) popup.firstChild.remove();

				let currentIndex = 1;
				try { currentIndex = Services.prefs.getIntPref(PREF_PREFIX + "index"); } catch(ex){}

				for (let i = 1; i <= 6; i++) {
					let text = "";
					try { text = Services.prefs.getStringPref(`${PREF_PREFIX}text.${i}`); } catch(ex){}

					let item = doc.createXULElement("menuitem");
					item.setAttribute("class", "menuitem-iconic");
					item.setAttribute("data-slot", i); 
					// Передаем цвет в CSS:
					item.style.setProperty("--slot-color", COLORS[i-1]);
					// Помечаем активный слот:
					if (currentIndex === i) {
						item.setAttribute("data-active", "true");
					}

					let displayStr = text.trim() === "" ? "[Пусто]" : text;
					item.setAttribute("label", `Слот ${i}: ${displayStr}`);

					item.addEventListener("click", (e) => {
						e.preventDefault();
						e.stopPropagation();

						let currentText = "";
						try { currentText = Services.prefs.getStringPref(`${PREF_PREFIX}text.${i}`); } catch(ex) {}

						if (e.button === 0) {
							popup.hidePopup();
							let input = { value: currentText };
							let checkState = { value: false };
							let result = Services.prompt.prompt(
								win, "Многоцветное автовыделение", 
								`Введите текст для слота ${i}\n(оставьте пустым для очистки):`, 
								input, null, checkState
							);

							if (result) {
								let newText = input.value.trim();
								if (newText.length > MAX_LENGTH) {
									showAlert("Многоцветное автовыделение", `❌ Текст слишком длинный (${newText.length} симв.).\nМаксимальная длина: ${MAX_LENGTH} симв.`);
									return;
								}
								Services.prefs.setStringPref(`${PREF_PREFIX}text.${i}`, newText);
								if (btn.getAttribute("data-highlighted") === "true") {
									injectHighlightToActiveTab();
								}
							}
						} 
						else if (e.button === 1) {
							popup.hidePopup();
							if (currentText) {
								Cc["@mozilla.org/widget/clipboardhelper;1"]
									.getService(Ci.nsIClipboardHelper).copyString(currentText);
								showAlert("Многоцветное автовыделение", `Текст из слота ${i} скопирован:\n«${currentText}»`);
							} else {
								showAlert("Многоцветное автовыделение", `Слот ${i} пуст, копировать нечего.`);
							}
						}
					});
					popup.appendChild(item);
				}

				popup.appendChild(doc.createXULElement("menuseparator"));

				// --- ЧЕКБОКСЫ НАСТРОЕК ---
				popup.appendChild(createPrefCheckbox("Учитывать регистр (Aa)", "matchCase"));
				popup.appendChild(createPrefCheckbox("Учитывать диакритику (ä)", "matchDiacritics"));
				popup.appendChild(doc.createXULElement("menuseparator"));

				let clearAll = doc.createXULElement("menuitem");
				clearAll.setAttribute("class", "menuitem-iconic");
				clearAll.setAttribute("image", "chrome://global/skin/icons/delete.svg");
				clearAll.setAttribute("label", "Очистить все слоты");
				clearAll.addEventListener("command", () => {
					for(let i = 1; i <= 6; i++) {
						Services.prefs.setStringPref(`${PREF_PREFIX}text.${i}`, "");
					}
					Services.prefs.setIntPref(PREF_PREFIX + "index", 1);
					updateBadge();
					showAlert("Многоцветное автовыделение", "Все слоты успешно очищены.");

					if (btn.getAttribute("data-highlighted") === "true") {
						injectHighlightToActiveTab();
					}
				});
				popup.appendChild(clearAll);

				popup.openPopup(btn, "after_start", 0, 0, false, false);
			});

			btn.addEventListener("wheel", (e) => {
				e.preventDefault();
				e.stopPropagation();

				let currentIndex = 1;
				try { currentIndex = Services.prefs.getIntPref(PREF_PREFIX + "index"); } catch(ex){}
				if (e.deltaY > 0) {
					currentIndex = (currentIndex >= 6) ? 1 : currentIndex + 1; 
				} else {
					currentIndex = (currentIndex <= 1) ? 6 : currentIndex - 1; 
				}
				Services.prefs.setIntPref(PREF_PREFIX + "index", currentIndex);
				updateBadge();

				if (popup.state === "open") {
					let menuItems = popup.querySelectorAll("menuitem[data-slot]");
					menuItems.forEach(item => {
						let slotIndex = parseInt(item.getAttribute("data-slot"));
						// Если слот совпадает с текущим индексом, добавляется data-active
						item.toggleAttribute("data-active", slotIndex === currentIndex);
					});
				}
				if (btn.getAttribute("data-highlighted") === "true") {
					injectHighlightToActiveTab();
				}
			});

			return btn;
		}
	});
}
