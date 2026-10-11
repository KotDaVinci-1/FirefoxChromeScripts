// ==UserScript==
// @name			Инфо-пробел
// @description		Расширяющийся пробел с заголовком и виджетами
// @compatibility	Firefox 153
// @version			1.0.5 Исправлена работа в нескольких окнах браузера (виджет и опрос данных теперь корректно привязаны к каждому окну).
// @version			1.0.4 Фикс потери данных о погоде браузером.
// @version			1.0.3 Для подсказки виджета даты добавлено кэширование данных.
// @version			1.0.2 Для подсказки виджета даты добавлен альтернативный источник данных.
// @version			1.0.1 В виджет погоды добавлена всплывающая подсказка с названием города.
// @version			1.0.0 (релиз)
// @homepage		https://github.com/KotDaVinci-1/FirefoxChromeScripts
// ==/UserScript==

(function() {
	if (window.UCDynamicSpring) return;
	window.UCDynamicSpring = true; // просто флаг «скрипт уже загружен в этом окне»

	const WIDGET_ID = "uc_dynamic_spring";

	// --- БЛОК КОНФИГУРАЦИИ ---
	const CONFIG = {
		modules: {
			MEMORY: 1,		// 0 - Откл; 1 - Слева;  2 - Справа		(память)
			CPU: 1,			// 0 - Откл; 1 - Слева;  2 - Справа		(CPU)
			GFX: 1,			// 0 - Откл; 1 - Слева;  2 - Справа		(графика)
			WEATHER: 2,		// 0 - Откл; 1 - Слева;  2 - Справа		(погода)
			DATEW: 2,		// 0 - Откл; 1 - Слева;  2 - Справа		(дата)
			BASIS: 2,		// 0 - Только виджеты;	 1 - Виджеты и расширяющийся пробел;   2 - заголовок страницы на расширяющемся пробеле
			WICONS: true,	// Иконка погоды
			POVOD: true		// Всплывающая подсказка с праздниками для модуля "дата" 
		},

		stylesBase: `
			/* --- БАЗОВЫЕ СТИЛИ ВИДЖЕТА --- */
			#uc_dynamic_spring { align-items: center; max-width: none !important; margin-inline: 2px; }

			#uc_dynamic_spring .uc-module {
				font-size: 14px;
				font-weight: 600;
				color: light-dark(#444, #CCC);
				font-family: monospace;
				background: light-dark(rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0.2));
				padding: 0 6px;
				margin: 0 2px;
				border-radius: 4px;
				display: flex;
				align-items: center;
				height: 100%;
				font-variant-numeric: tabular-nums;
			}

			/* Обращаемся к самому виджету в режиме настройки */
			#main-window[customizing] #customization-content-container #uc_dynamic_spring {
				background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 42 12' fill='context-fill' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath transform='rotate(-45, 20, -5)' d='m10.00068,1.92741a1,1 0 0 0 0.71,-0.29a1,1 0 0 0 0,-1.42l-4.47,-4.46l1.59,0a1,1 0 0 0 0,-2l-4,0a1,1 0 0 0 -0.38,0.08a1,1 0 0 0 -0.54,0.54a1,1 0 0 0 -0.08,0.38l0,4a1,1 0 0 0 2,0l0,-1.59l4.46,4.47a1,1 0 0 0 0.71,0.29zm6.37,-1.71a1,1 0 0 0 -1.42,0l-5.66,5.66a1,1 0 0 0 0,1.42a1,1 0 0 0 0.71,0.29a1,1 0 0 0 0.71,-0.29l5.66,-5.66a1,1 0 0 0 0,-1.42zm5.46,7.54a1,1 0 0 0 -1,1l0,1.59l-4.46,-4.47a1,1 0 1 0 -1.42,1.42l4.47,4.46l-1.59,0a1,1 0 0 0 0,2l4,0a1,1 0 0 0 0.38,-0.08a1,1 0 0 0 0.54,-0.54a1,1 0 0 0 0.08,-0.38l0,-4a1,1 0 0 0 -1,-1z'/%3E%3C/svg%3E");
				background-repeat: no-repeat;
				background-position: center;
				fill: currentcolor;
				-moz-context-properties: fill;
				min-height: 42px;
			}
			/* Прячем все реальные внутренности виджета (погоду, память и т.д.), чтобы они не перекрывали иконку */
			#main-window[customizing] #customization-content-container #uc_dynamic_spring > * { display: none !important; }

			/*заголовок страницы*/
			#uc_dynamic_spring #uc-dynamic-title {
				flex: 1;
				text-align: center;
				font-size: 18px;
				font-weight: 600;
				color: #0ff;
				color: light-dark(#00F, #0FF);
				margin: 0 6px;
				transform: translateY(-2px);
			}
			#uc_dynamic_spring #uc-dynamic-title::before { width: 100%; }

			/*погода*/
			#uc-module-weather.uc-module.weather-widget #uc-module-weather-temp { margin: 0; display: flex; min-width: 5ch; justify-content: center; line-height: 1; }

			#uc-dynamic-left,
			#uc-dynamic-right { height: calc(100% - 2px); max-height: 28px; }
			#uc-dynamic-right { margin-left: auto; }

			`,

			stylesFF: `
			#uc_dynamic_spring .weather-widget .weather-icon { height: 22px; width: 22px; scale: 1.2; margin-right: 6px; display: none; }
			#uc-module-weather.uc-module.weather-widget #uc-module-weather-temp { justify-content: flex-end !important; }

			/* --- СКОПИРОВАННЫЕ ПРАВИЛА ИКОНОК FIREFOX --- */
			#uc_dynamic_spring .weather-widget .weather-icon.iconId1 { content: url("chrome://browser/skin/weather/sunny.svg"); scale: 0.94; }
			#uc_dynamic_spring .weather-widget .weather-icon.iconId2 { content: url("chrome://browser/skin/weather/mostly-sunny.svg"); scale: 1.4; }
			#uc_dynamic_spring .weather-widget .weather-icon:is(.iconId3, .iconId4, .iconId6) { content: url("chrome://browser/skin/weather/partly-sunny.svg"); scale: 1.28; bottom: -1px; position: relative; }
			#uc_dynamic_spring .weather-widget .weather-icon.iconId5 { content: url("chrome://browser/skin/weather/hazy-sunshine.svg"); scale: 1.14; }
			#uc_dynamic_spring .weather-widget .weather-icon:is(.iconId7, .iconId8) { content: url("chrome://browser/skin/weather/cloudy.svg"); scale: 1.3; }
			#uc_dynamic_spring .weather-widget .weather-icon.iconId11 { content: url("chrome://browser/skin/weather/fog.svg"); scale: 1.28; }
			#uc_dynamic_spring .weather-widget .weather-icon.iconId12 { content: url("chrome://browser/skin/weather/showers.svg"); top: -1px; position: relative; }
			#uc_dynamic_spring .weather-widget .weather-icon:is(.iconId13, .iconId14) { content: url("chrome://browser/skin/weather/mostly-cloudy-with-showers.svg"); scale: 1.12; bottom: -1px; position: relative; }
			#uc_dynamic_spring .weather-widget .weather-icon.iconId15 { content: url("chrome://browser/skin/weather/thunderstorms.svg"); }
			#uc_dynamic_spring .weather-widget .weather-icon:is(.iconId16, .iconId17) { content: url("chrome://browser/skin/weather/mostly-cloudy-with-thunderstorms.svg"); scale: 1.04; }
			#uc_dynamic_spring .weather-widget .weather-icon.iconId18 { content: url("chrome://browser/skin/weather/rain.svg"); scale: 1.12; top: -1px; position: relative; }
			#uc_dynamic_spring .weather-widget .weather-icon:is(.iconId19, .iconId20, .iconId25) { content: url("chrome://browser/skin/weather/flurries.svg"); scale: 1.12; }
			#uc_dynamic_spring .weather-widget .weather-icon.iconId21 { content: url("chrome://browser/skin/weather/partly-sunny-with-flurries.svg"); scale: 1.08; }
			#uc_dynamic_spring .weather-widget .weather-icon:is(.iconId22, .iconId23) { content: url("chrome://browser/skin/weather/snow.svg"); }
			#uc_dynamic_spring .weather-widget .weather-icon:is(.iconId24, .iconId31) { content: url("chrome://browser/skin/weather/ice.svg"); scale: 1; }
			#uc_dynamic_spring .weather-widget .weather-icon:is(.iconId26, .iconId29) { content: url("chrome://browser/skin/weather/freezing-rain.svg"); scale: 1.18; }
			#uc_dynamic_spring .weather-widget .weather-icon.iconId30 { content: url("chrome://browser/skin/weather/hot.svg"); scale: 1; }
			#uc_dynamic_spring .weather-widget .weather-icon.iconId32 { content: url("chrome://browser/skin/weather/windy.svg"); scale: 1.12; top: -1px; position: relative; }
			#uc_dynamic_spring .weather-widget .weather-icon.iconId33 { content: url("chrome://browser/skin/weather/night-clear.svg"); scale: 1.28; }
			#uc_dynamic_spring .weather-widget .weather-icon:is(.iconId34, .iconId35, .iconId36, .iconId38) { content: url("chrome://browser/skin/weather/night-mostly-clear.svg"); scale: 1.24; }
			#uc_dynamic_spring .weather-widget .weather-icon.iconId37 { content: url("chrome://browser/skin/weather/night-hazy-moonlight.svg"); }
			#uc_dynamic_spring .weather-widget .weather-icon:is(.iconId39, .iconId40) { content: url("chrome://browser/skin/weather/night-partly-cloudy-with-showers.svg"); }
			#uc_dynamic_spring .weather-widget .weather-icon:is(.iconId41, .iconId42) { content: url("chrome://browser/skin/weather/night-partly-cloudy-with-thunderstorms.svg"); }
			#uc_dynamic_spring .weather-widget .weather-icon:is(.iconId43, .iconId44) { content: url("chrome://browser/skin/weather/night-mostly-cloudy-with-flurries.svg"); }
		`
	};

	// Стили и pref'ы — не завязаны на CustomizableUI, применяются в каждом окне независимо, это нормально
	let finalCSS = CONFIG.stylesBase;
	if (CONFIG.modules.WICONS) { finalCSS += CONFIG.stylesFF; }
	let cssEl = document.createElementNS("http://www.w3.org/1999/xhtml", "style");
	cssEl.textContent = finalCSS;
	document.head.appendChild(cssEl);

	if (CONFIG.modules.WEATHER > 0) {
		try {
			Services.prefs.setBoolPref("browser.newtabpage.activity-stream.system.showWeather", true);
		} catch (e) {}
	}

	// --- Регистрация виджета: ТОЛЬКО ОДИН РАЗ за всю сессию браузера ---
	// CustomizableUI — общий на весь процесс сервис. Если вызывать createWidget
	// из каждого окна повторно (а .uc.js грузится в каждое окно заново), второй
	// вызов ломает внутреннее состояние CustomizableUI (см. TypeError в консоли).
	// Дальше сам CustomizableUI вызовет onBuild(aDocument) для каждого текущего
	// и будущего окна — этого достаточно.
	if (!CustomizableUI.getWidget(WIDGET_ID)) {
		// Здесь и ниже, ВНУТРИ onBuild, нельзя использовать голые window/document —
		// эта функция создаётся один раз и «помнит» окно, в котором была создана.
		// Всё окно-зависимое берём из aDocument.defaultView (win).
		const perWindowCleanup = new WeakMap();

		CustomizableUI.createWidget({
			id: WIDGET_ID,
			type: "custom",

			onBuild: function(aDocument) {
				const win = aDocument.defaultView;
				const timers = [];
				const cleanups = [];
				const track = (id) => { timers.push(id); return id; };

				let spring = aDocument.createXULElement(CONFIG.modules.BASIS > 0 ? "toolbarspring" : "toolbaritem");
				spring.id = WIDGET_ID;
				spring.className = "customizableui-space";
				spring.setAttribute("label", "Инфо-пробел");

				let leftBox = aDocument.createXULElement("hbox");
				leftBox.id = "uc-dynamic-left";

				let rightBox = aDocument.createXULElement("hbox");
				rightBox.id = "uc-dynamic-right";

				spring.appendChild(leftBox);

				let titleLabel = null;
				if (CONFIG.modules.BASIS === 2) {
					titleLabel = aDocument.createXULElement("label");
					titleLabel.id = "uc-dynamic-title";
					titleLabel.setAttribute("crop", "end");
					titleLabel.setAttribute("value", "Загрузка...");
					spring.appendChild(titleLabel);
				}

				spring.appendChild(rightBox);

				// --- Заголовок вкладки ---
				if (titleLabel && win.gBrowser) {
					const updateTitleValue = () => {
						if (win.gBrowser.selectedTab) {
							titleLabel.setAttribute("value", win.gBrowser.selectedTab.label || "");
						}
					};
					const onTabSelectTitle = () => updateTitleValue();
					const onTabAttrModified = (event) => {
						if (event.detail.changed.includes("label") && event.target === win.gBrowser.selectedTab) {
							updateTitleValue();
						}
					};
					const progressListener = {
						onLocationChange(aBrowser) {
							if (aBrowser === win.gBrowser.selectedBrowser) updateTitleValue();
						}
					};
					win.gBrowser.tabContainer.addEventListener("TabSelect", onTabSelectTitle);
					win.gBrowser.tabContainer.addEventListener("TabAttrModified", onTabAttrModified);
					win.gBrowser.addTabsProgressListener(progressListener);
					cleanups.push(() => {
						win.gBrowser.tabContainer.removeEventListener("TabSelect", onTabSelectTitle);
						win.gBrowser.tabContainer.removeEventListener("TabAttrModified", onTabAttrModified);
						win.gBrowser.removeTabsProgressListener(progressListener);
					});
					track(win.setTimeout(updateTitleValue, 500));
				}

				// --- Модуль: Память ---
				if (CONFIG.modules.MEMORY > 0) {
					let memLabel = aDocument.createXULElement("label");
					memLabel.id = "uc-module-memory";
					memLabel.className = "uc-module";
					memLabel.setAttribute("value", "Mem: -- MB");
					(CONFIG.modules.MEMORY === 1 ? leftBox : rightBox).appendChild(memLabel);

					const updateMemoryValue = async () => {
						if (!win.gBrowser || !win.gBrowser.selectedBrowser) return;
						try {
							const procInfo = await ChromeUtils.requestProcInfo();
							const outerWindowId = win.gBrowser.selectedBrowser.outerWindowID;
							let memory = '--';
							for (const childProc of procInfo.children) {
								if (childProc.windows) {
									for (const w of childProc.windows) {
										if (w.outerWindowId === outerWindowId) {
											memory = String(Math.round(childProc.memory / (1024 * 1024))).padStart(4, '\u2007');
											break;
										}
									}
								}
							}
							memLabel.setAttribute("value", `Mem: ${memory} MB`);
						} catch (e) { console.error("uc_dynamic_spring: ошибка модуля памяти", e); }
					};

					updateMemoryValue();
					track(win.setInterval(updateMemoryValue, 3000));
					if (win.gBrowser) {
						win.gBrowser.tabContainer.addEventListener("TabSelect", updateMemoryValue);
						cleanups.push(() => win.gBrowser.tabContainer.removeEventListener("TabSelect", updateMemoryValue));
					}
				}

				// --- Модули: CPU / GFX (общий опрос процессов) ---
				if (CONFIG.modules.CPU > 0 || CONFIG.modules.GFX > 0) {
					let cpuEl = null, gfxEl = null;

					if (CONFIG.modules.CPU > 0) {
						cpuEl = aDocument.createXULElement("label");
						cpuEl.id = "uc-module-cpu";
						cpuEl.className = "uc-module";
						cpuEl.setAttribute("value", "CPU: \u2007\u2007--%");
						(CONFIG.modules.CPU === 1 ? leftBox : rightBox).appendChild(cpuEl);
					}

					if (CONFIG.modules.GFX > 0) {
						gfxEl = aDocument.createXULElement("label");
						gfxEl.id = "uc-module-gfx";
						gfxEl.className = "uc-module";
						gfxEl.setAttribute("value", "GFX: \u2007\u2007--%");
						(CONFIG.modules.GFX === 1 ? leftBox : rightBox).appendChild(gfxEl);
					}

					let lastCpu = { pid: null, cpuTime: 0, timestamp: 0 };
					let lastGfx = { cpuTime: 0, timestamp: 0 };

					const formatCpuPercent = (cpuDelta, timeDelta) => {
						if (timeDelta <= 0 || cpuDelta < 0) return null;
						const cores = win.navigator.hardwareConcurrency || 1;
						return String((cpuDelta / (timeDelta * 10000) / cores).toFixed(1)).padStart(4, '\u2007');
					};

					const updateModules = async (isTabSelect = false) => {
						if (!cpuEl && !gfxEl) return;
						try {
							const procInfo = await ChromeUtils.requestProcInfo();
							const now = Date.now();
							const outerWindowId = win.gBrowser?.selectedBrowser?.outerWindowID;

							let currentTabCpuTime = 0;
							let currentTabPid = null;
							let totalGfxCpuTime = 0;

							for (const childProc of procInfo.children) {
								if (gfxEl && !isTabSelect && (childProc.type === 'gpu' || childProc.type === 'rdd' || childProc.type === 'utility')) {
									totalGfxCpuTime += childProc.cpuTime;
								}
								if (cpuEl && outerWindowId && childProc.windows) {
									for (const w of childProc.windows) {
										if (w.outerWindowId === outerWindowId) {
											currentTabCpuTime = childProc.cpuTime;
											currentTabPid = childProc.pid;
										}
									}
								}
							}

							if (cpuEl && currentTabPid) {
								if (lastCpu.pid !== currentTabPid) {
									lastCpu = { pid: currentTabPid, cpuTime: currentTabCpuTime, timestamp: now };
									cpuEl.setAttribute("value", `CPU: \u2007\u2007--%`);
								} else if (lastCpu.timestamp > 0) {
									const formatted = formatCpuPercent(currentTabCpuTime - lastCpu.cpuTime, now - lastCpu.timestamp);
									if (formatted) cpuEl.setAttribute("value", `CPU: ${formatted}%`);
									lastCpu.cpuTime = currentTabCpuTime;
									lastCpu.timestamp = now;
								}
							}

							if (gfxEl && !isTabSelect) {
								if (lastGfx.timestamp > 0) {
									const formatted = formatCpuPercent(totalGfxCpuTime - lastGfx.cpuTime, now - lastGfx.timestamp);
									if (formatted) gfxEl.setAttribute("value", `GFX: ${formatted}%`);
								}
								lastGfx.cpuTime = totalGfxCpuTime;
								lastGfx.timestamp = now;
							}
						} catch (e) { console.error("uc_dynamic_spring: ошибка обновления CPU/GFX", e); }
					};

					updateModules(false);
					track(win.setInterval(() => updateModules(false), 3000));
					if (win.gBrowser) {
						const onTabSelectCpu = () => updateModules(true);
						win.gBrowser.tabContainer.addEventListener("TabSelect", onTabSelectCpu);
						cleanups.push(() => win.gBrowser.tabContainer.removeEventListener("TabSelect", onTabSelectCpu));
					}
				}

				// --- Модуль: Погода ---
				if (CONFIG.modules.WEATHER > 0) {
					let weatherBox = aDocument.createXULElement("hbox");
					weatherBox.id = "uc-module-weather";
					weatherBox.className = "uc-module weather-widget";

					let weatherIcon = aDocument.createXULElement("image");
					weatherIcon.id = "uc-module-weather-icon";
					weatherIcon.className = "weather-icon";

					let weatherTemp = aDocument.createXULElement("label");
					weatherTemp.id = "uc-module-weather-temp";
					weatherTemp.setAttribute("value", "--°C");

					weatherBox.appendChild(weatherIcon);
					weatherBox.appendChild(weatherTemp);

					(CONFIG.modules.WEATHER === 1 ? leftBox : rightBox).appendChild(weatherBox);

					const updateWeatherValue = async () => {
						try {
							const weatherFile = PathUtils.join(PathUtils.profileDir, "activity-stream.weather_feed.json");
							if (!(await IOUtils.exists(weatherFile))) return;

							const data = await IOUtils.readJSON(weatherFile);

							if (data?.locationData?.city) {
								weatherBox.setAttribute("tooltiptext", data.locationData.city);
							} else {
								weatherBox.removeAttribute("tooltiptext");
							}

							const conditions = data?.weather?.suggestions?.[0]?.current_conditions;

							if (conditions && conditions.temperature?.c !== undefined) {
								let currentTemp = conditions.temperature.c;
								weatherTemp.setAttribute("value", `${currentTemp > 0 ? "+" + currentTemp : currentTemp}°C`);

								const iconId = conditions.icon_id;
								if (iconId && CONFIG.modules.WICONS) {
									weatherIcon.setAttribute("class", `weather-icon iconId${iconId}`);
									weatherIcon.style.display = "block";
								} else {
									weatherIcon.setAttribute("class", "weather-icon");
									weatherIcon.style.display = "none";
								}
							} else {
								weatherTemp.setAttribute("value", "--°C");
								weatherIcon.setAttribute("class", "weather-icon");
								weatherIcon.style.display = "none";
							}
						} catch (e) {}
					};

					track(win.setTimeout(updateWeatherValue, 5000));
					track(win.setInterval(updateWeatherValue, 180000));
				}

				// --- Модуль: Дата ---
				if (CONFIG.modules.DATEW > 0) {
					let dateEl = aDocument.createXULElement("label");
					dateEl.id = "uc-module-date";
					dateEl.className = "uc-module";
					dateEl.setAttribute("value", "Дата");
					(CONFIG.modules.DATEW === 1 ? leftBox : rightBox).appendChild(dateEl);

					let lastCheckedDate = null;

					const updatePovodTooltip = async () => {
						const PREF_LAST = "uc.module.date.povod.last_update";
						const PREF_DATA = "uc.module.date.povod.cached_json"; // Храним сырые данные, а не текст

						const SOURCES = [
							"https://raw.githubusercontent.com/KotDaVinci-1/FirefoxChromeScripts/main/holidays/povod.json",
							"https://docs.google.com/spreadsheets/d/1PNqCvPUxSdyyw3zVbemQWE62XfBiHUC7klBt6vuWBvc/export?format=tsv&gid=771050827&range=A:A"
						];

						let getDDMM = (d) => String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0');

						let now = new Date();
						let todayFull = getDDMM(now) + '.' + now.getFullYear();

						let data = null;
						let isOfflineCache = false;
						let lastUpdate = "";

						try { lastUpdate = Services.prefs.getStringPref(PREF_LAST, ""); } catch(e) {}

						// 1. Сетевой запрос нужен только если сегодня еще не обновляли
						if (lastUpdate !== todayFull) {
							dateEl.setAttribute("tooltiptext", "Сверяемся с календарем...");

							for (let url of SOURCES) {
								try {
									let response = await fetch(url, { cache: "no-store" });
									if (!response.ok) throw new Error("HTTP " + response.status);

									data = JSON.parse(await response.text());
									Services.prefs.setStringPref(PREF_DATA, JSON.stringify(data));
									Services.prefs.setStringPref(PREF_LAST, todayFull);
									break;
								} catch (e) { console.warn(`uc_dynamic_spring: Источник недоступен (${url})`); }
							}
						}

						// 2. Читаем из кэша, если сеть упала ИЛИ если сегодня уже скачивали данные
						if (!data) {
							try {
								let cachedStr = Services.prefs.getStringPref(PREF_DATA, "");
								if (cachedStr) {
									data = JSON.parse(cachedStr);
									if (lastUpdate !== todayFull) isOfflineCache = true;
								}
							} catch(e) { console.error("uc_dynamic_spring: Ошибка чтения кэша", e); }
						}

						if (!data) {
							dateEl.setAttribute("tooltiptext", "Не удалось загрузить праздники");
							return;
						}

						let todayDDMM = getDDMM(now);
						let tomorrow = new Date(now);
						tomorrow.setDate(tomorrow.getDate() + 1);
						let tomorrowDDMM = getDDMM(tomorrow);

						let todayHolidays = data[todayDDMM];
						let tomorrowHolidays = data[tomorrowDDMM];
						let tooltipText = "";

						if (todayHolidays || tomorrowHolidays) {
							let parts = [];
							if (todayHolidays) parts.push("Праздник(и) сегодня:\n" + todayHolidays.join("\n"));
							if (tomorrowHolidays) parts.push("Праздник(и) завтра:\n" + tomorrowHolidays.join("\n"));
							tooltipText = parts.join("\n\n");
						} else {
							let nextDate = new Date(now);
							let found = false;
							for (let i = 2; i <= 200; i++) {
								nextDate.setDate(nextDate.getDate() + 1);
								let nextDDMM = getDDMM(nextDate);

								if (data[nextDDMM]) {
									tooltipText = `Ближайший праздник (${nextDDMM}):\n` + data[nextDDMM].join("\n");
									found = true;
									break;
								}
							}
							if (!found) tooltipText = "Нет предстоящих праздников в базе.";
						}

						if (isOfflineCache) {
							tooltipText += "\n\n[Нет сети. Используется кэш]";
						}

						dateEl.setAttribute("tooltiptext", tooltipText);
					};

					const updateDateValue = () => {
						let now = new Date();
						let currentDate = now.getDate();

						if (lastCheckedDate === currentDate) return;
						lastCheckedDate = currentDate;

						let options = { weekday: 'short', day: 'numeric', month: 'short' };
						let dateStr = now.toLocaleDateString('ru-RU', options);

						dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
						dateStr = dateStr.replace(/\.$/, '');
						dateEl.setAttribute("value", dateStr);

						if (CONFIG.modules.POVOD) {
							updatePovodTooltip();
						} else {
							dateEl.removeAttribute("tooltiptext");
						}
					};

					updateDateValue();
					track(win.setTimeout(updateDateValue, 5000));
					track(win.setInterval(updateDateValue, 60000));
				}

				// Сохраняем функцию очистки для этого конкретного окна
				perWindowCleanup.set(win, () => {
					timers.forEach((id) => { win.clearTimeout(id); win.clearInterval(id); });
					cleanups.forEach((fn) => { try { fn(); } catch (e) {} });
				});

				return spring;
			},

			onDestroyed: function(aDocument) {
				const win = aDocument.defaultView;
				const cleanup = perWindowCleanup.get(win);
				if (cleanup) {
					try { cleanup(); } catch (e) {}
					perWindowCleanup.delete(win);
				}
			}
		});
	}
})();
