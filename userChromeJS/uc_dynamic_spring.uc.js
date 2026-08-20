// ==UserScript==
// @name			Инфо-пробел
// @description		Расширяющийся пробел с заголовком и виджетами
// @compatibility	Firefox 153
// @version			1.0.0 (релиз)
// @homepage		https://github.com/KotDaVinci-1/FirefoxChromeScripts
// ==/UserScript==

(function() {
	if (window.UCDynamicSpring) return;

	// --- БЛОК КОНФИГУРАЦИИ ---
	const CONFIG = {
		modules: {
			MEMORY: 1,		// 0 - Откл; 1 - Слева;  2 - Справа		(память)
			CPU: 1,			// 0 - Откл; 1 - Слева;  2 - Справа		(погода)
			GFX: 1,			// 0 - Откл; 1 - Слева;  2 - Справа		(графика)
			WEATHER: 2,		// 0 - Откл; 1 - Слева;  2 - Справа		(погода)
			DATEW: 2,		// 0 - Откл; 1 - Слева;  2 - Справа		(дата)
			BASIS: 2,		// 0 - Только виджеты; 1 - 0 + Расширяющийся пробел; 2 - 1 + заголовок страницы
			WICONS: true,	// Иконка погоды
			POVOD: true		// Праздники
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

	window.UCDynamicSpring = {
		init: function() {
			// Собираем стили на основе конфигурации
			let finalCSS = CONFIG.stylesBase;
			if (CONFIG.modules.WICONS) { finalCSS += CONFIG.stylesFF; }

			let css = document.createElementNS("http://www.w3.org/1999/xhtml", "style");
			css.textContent = finalCSS;
			document.head.appendChild(css);

			if (CONFIG.modules.WEATHER > 0) {
				try {
					Services.prefs.setBoolPref("browser.newtabpage.activity-stream.system.showWeather", true);
				} catch (e) {}
			}

			CustomizableUI.createWidget({
				id: "uc_dynamic_spring",
				type: "custom",

				onBuild: function(aDocument) {
					let spring = aDocument.createXULElement(CONFIG.modules.BASIS > 0 ? "toolbarspring" : "toolbaritem");
					spring.id = "uc_dynamic_spring";
					spring.className = "customizableui-space";
					spring.setAttribute("label", "Инфо-пробел");

					let leftBox = aDocument.createXULElement("hbox");
					leftBox.id = "uc-dynamic-left";

					let rightBox = aDocument.createXULElement("hbox");
					rightBox.id = "uc-dynamic-right";

					spring.appendChild(leftBox);

					if (CONFIG.modules.BASIS === 2) {
						let titleLabel = aDocument.createXULElement("label");
						titleLabel.id = "uc-dynamic-title";
						titleLabel.setAttribute("crop", "end");
						titleLabel.setAttribute("value", "Загрузка...");
						spring.appendChild(titleLabel);
					}

					spring.appendChild(rightBox);

					// --- Модуль: Память ---
					if (CONFIG.modules.MEMORY > 0) {
						let memLabel = aDocument.createXULElement("label");
						memLabel.id = "uc-module-memory";
						memLabel.className = "uc-module";
						memLabel.setAttribute("value", "Mem: -- MB");

						if (CONFIG.modules.MEMORY === 1) leftBox.appendChild(memLabel);
						else if (CONFIG.modules.MEMORY === 2) rightBox.appendChild(memLabel);

						window.UCDynamicSpring.startMemoryPolling();
					}

					// --- Модуль: CPU ---
					if (CONFIG.modules.CPU > 0) {
						let cpuLabel = aDocument.createXULElement("label");
						cpuLabel.id = "uc-module-cpu";
						cpuLabel.className = "uc-module";
						cpuLabel.setAttribute("value", "CPU: \u2007\u2007--%");

						if (CONFIG.modules.CPU === 1) leftBox.appendChild(cpuLabel);
						else if (CONFIG.modules.CPU === 2) rightBox.appendChild(cpuLabel);
					}

					// --- Модуль: GFX ---
					if (CONFIG.modules.GFX > 0) {
						let gfxLabel = aDocument.createXULElement("label");
						gfxLabel.id = "uc-module-gfx";
						gfxLabel.className = "uc-module";
						gfxLabel.setAttribute("value", "GFX: \u2007\u2007--%");

						if (CONFIG.modules.GFX === 1) leftBox.appendChild(gfxLabel);
						else if (CONFIG.modules.GFX === 2) rightBox.appendChild(gfxLabel);
					}

					// --- Единая точка запуска опроса ---
					if (CONFIG.modules.CPU > 0 || CONFIG.modules.GFX > 0) {
						window.UCDynamicSpring.startPolling();
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

						if (CONFIG.modules.WEATHER === 1) leftBox.appendChild(weatherBox);
						else if (CONFIG.modules.WEATHER === 2) rightBox.appendChild(weatherBox);

						window.UCDynamicSpring.startWeatherPolling();
					}

					// --- Модуль: Дата ---
					if (CONFIG.modules.DATEW > 0) {
						let memLabel = aDocument.createXULElement("label");
						memLabel.id = "uc-module-date";
						memLabel.className = "uc-module";
						memLabel.setAttribute("value", "Дата");

						if (CONFIG.modules.DATEW === 1) leftBox.appendChild(memLabel);
						else if (CONFIG.modules.DATEW === 2) rightBox.appendChild(memLabel);

						window.UCDynamicSpring.startDatePolling();
					}

					setTimeout(() => window.UCDynamicSpring.updateTitle(), 500);

					return spring;
				}
			});

			if (CONFIG.modules.BASIS === 2 && window.gBrowser) {
				window.gBrowser.tabContainer.addEventListener("TabSelect", () => this.updateTitle());
				window.gBrowser.tabContainer.addEventListener("TabAttrModified", (event) => {
					if (event.detail.changed.includes("label") && event.target === window.gBrowser.selectedTab) {
						this.updateTitle();
					}
				});
				window.gBrowser.addTabsProgressListener({
					onLocationChange(aBrowser) {
						if (aBrowser === window.gBrowser.selectedBrowser) {
							window.UCDynamicSpring.updateTitle();
						}
					}
				});
			}
		},

		updateTitle: function() {
			let titleEl = document.getElementById("uc-dynamic-title");
			if (titleEl && window.gBrowser && window.gBrowser.selectedTab) {
				titleEl.setAttribute("value", window.gBrowser.selectedTab.label || "");
			}
		},

		updateMemoryValue: async function() {
			let memEl = document.getElementById("uc-module-memory");
			if (!memEl || !window.gBrowser || !window.gBrowser.selectedBrowser) return;

			try {
				const procInfo = await ChromeUtils.requestProcInfo();
				const outerWindowId = window.gBrowser.selectedBrowser.outerWindowID;
				let memory = '--';

				for (const childProc of procInfo.children) {
					if (childProc.windows) {
						for (const win of childProc.windows) {
							if (win.outerWindowId === outerWindowId) {
								let memNumber = Math.round(childProc.memory / (1024 * 1024));
								memory = String(memNumber).padStart(4, '\u2007');
								break;
							}
						}
					}
				}
				memEl.setAttribute("value", `Mem: ${memory} MB`);
			} catch (e) {console.error("Ошибка:", e);}
		},

		updateWeatherValue: async function() {
			let tempEl = document.getElementById("uc-module-weather-temp");
			let iconEl = document.getElementById("uc-module-weather-icon");
			let weatherBox = document.getElementById("uc-module-weather");
			if (!tempEl || !iconEl || !weatherBox) return;

			try {
				const weatherFile = PathUtils.join(PathUtils.profileDir, "activity-stream.weather_feed.json");

				if (!(await IOUtils.exists(weatherFile))) return;

				const data = await IOUtils.readJSON(weatherFile);

				// Извлекаем только базовую температуру и ID иконки
				if (data?.weather?.suggestions?.[0]?.current_conditions) {
					const conditions = data.weather.suggestions[0].current_conditions;

					if (conditions.temperature?.c !== undefined) {
						let currentTemp = conditions.temperature.c;
						tempEl.setAttribute("value", `${currentTemp > 0 ? "+" + currentTemp : currentTemp}°C`);
					}

					const iconId = conditions.icon_id;
					if (iconId && CONFIG.modules.WICONS) {
						iconEl.setAttribute("class", `weather-icon iconId${iconId}`);
						iconEl.style.display = "block";
					} else {
						iconEl.setAttribute("class", "weather-icon");
						iconEl.style.display = "none";
					}
				}
			} catch (e) {}
		},

		// Отдельные хранилища состояния
		_lastCpu: { pid: null, cpuTime: 0, timestamp: 0 },
		_lastGfx: { cpuTime: 0, timestamp: 0 },
		// Вспомогательный математический калькулятор
		_formatCpuPercent: function(cpuDelta, timeDelta) {
			if (timeDelta <= 0 || cpuDelta < 0) return null;
			const cores = navigator.hardwareConcurrency || 1;
			let percent = (cpuDelta / (timeDelta * 10000) / cores).toFixed(1);
			return String(percent).padStart(4, '\u2007');
		},

		// Единый главный метод обхода процессов
		updateModules: async function(isTabSelect = false) {
			let cpuEl = document.getElementById("uc-module-cpu");
			let gfxEl = document.getElementById("uc-module-gfx");
			if (!cpuEl && !gfxEl) return;

			try {
				const procInfo = await ChromeUtils.requestProcInfo();
				const now = Date.now();
				const outerWindowId = window.gBrowser?.selectedBrowser?.outerWindowID;

				let currentTabCpuTime = 0;
				let currentTabPid = null;
				let totalGfxCpuTime = 0;

				for (const childProc of procInfo.children) {
					if (gfxEl && !isTabSelect && (childProc.type === 'gpu' || childProc.type === 'rdd' || childProc.type === 'utility')) {
						totalGfxCpuTime += childProc.cpuTime;
					}
					// Считаем CPU только если виджет включен
					if (cpuEl && outerWindowId && childProc.windows) {
						for (const win of childProc.windows) {
							if (win.outerWindowId === outerWindowId) {
								currentTabCpuTime = childProc.cpuTime;
								currentTabPid = childProc.pid;
							}
						}
					}
				}

				// --- Обновление CPU (отрабатывает и по таймеру) ---
				if (cpuEl && currentTabPid) {
					if (this._lastCpu.pid !== currentTabPid) {
						this._lastCpu = { pid: currentTabPid, cpuTime: currentTabCpuTime, timestamp: now };
						cpuEl.setAttribute("value", `CPU: \u2007\u2007--%`);
					} else if (this._lastCpu.timestamp > 0) {
						const formatted = this._formatCpuPercent(
							currentTabCpuTime - this._lastCpu.cpuTime,
							now - this._lastCpu.timestamp
						);
						if (formatted) cpuEl.setAttribute("value", `CPU: ${formatted}%`);
						this._lastCpu.cpuTime = currentTabCpuTime;
						this._lastCpu.timestamp = now;
					}
				}

				// --- Обновление GFX (отрабатывает ТОЛЬКО по таймеру) ---
				if (gfxEl && !isTabSelect) {
					if (this._lastGfx.timestamp > 0) {
						const formatted = this._formatCpuPercent(
							totalGfxCpuTime - this._lastGfx.cpuTime,
							now - this._lastGfx.timestamp
						);
						if (formatted) gfxEl.setAttribute("value", `GFX: ${formatted}%`);
					}
					this._lastGfx.cpuTime = totalGfxCpuTime;
					this._lastGfx.timestamp = now;
				}

			} catch (e) {
				console.error("Ошибка обновления CPU/GFX:", e);
			}
		},

		updateDateValue: function() {
			let dateEl = document.getElementById("uc-module-date");
			if (!dateEl) return;

			let now = new Date();
			let currentDate = now.getDate();

			if (this._lastCheckedDate === currentDate) return;
			this._lastCheckedDate = currentDate;

			let options = { weekday: 'short', day: 'numeric', month: 'short' };
			let dateStr = now.toLocaleDateString('ru-RU', options);

			dateStr = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
			dateStr = dateStr.replace(/\.$/, '');
			dateEl.setAttribute("value", dateStr);

			// Проверяем конфиг перед вызовом логики праздников
			if (CONFIG.modules.POVOD) {
				this.updatePovodTooltip(dateEl);
			} else {
				dateEl.removeAttribute("tooltiptext");
			}
		},

		// Логика получения и кэширования праздников
		updatePovodTooltip: async function(dateEl) {
			const PREF_LAST = "uc.module.date.povod.last_update";
			const PREF_TEXT = "uc.module.date.povod.tooltip_text";
			const RAW_URL = "https://raw.githubusercontent.com/KotDaVinci-1/FirefoxChromeScripts/main/holidays/povod.json";

			let getDDMM = (d) => String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0');

			let now = new Date();
			let todayFull = getDDMM(now) + '.' + now.getFullYear(); // DD.MM.YYYY для кэша

			// Читаем кэш из about:config
			try {
				let lastUpdate = Services.prefs.getStringPref(PREF_LAST, "");
				let cachedText = Services.prefs.getStringPref(PREF_TEXT, "");

				// Если дата актуальна, применяем сохраненный текст и отдыхаем
				if (lastUpdate === todayFull && cachedText) {
					dateEl.setAttribute("tooltiptext", cachedText);
					return;
				}
			} catch(e) {}

			// Данные устарели или их нет - вешаем временную подсказку и идем за JSON
			dateEl.setAttribute("tooltiptext", "Сверяемся с календарем...");

			try {
				let response = await fetch(RAW_URL, { cache: "no-store" });
				if (!response.ok) throw new Error("HTTP " + response.status);
				let data = await response.json();

				let todayDDMM = getDDMM(now);
				let tomorrow = new Date(now);
				tomorrow.setDate(tomorrow.getDate() + 1);
				let tomorrowDDMM = getDDMM(tomorrow);

				let todayHolidays = data[todayDDMM];
				let tomorrowHolidays = data[tomorrowDDMM];
				let tooltipText = "";

				// Логика формирования текста
				if (todayHolidays || tomorrowHolidays) {
					let parts = [];
					if (todayHolidays) {
						parts.push("Праздник(и) сегодня:\n" + todayHolidays.join("\n"));
					}
					if (tomorrowHolidays) {
						parts.push("Праздник(и) завтра:\n" + tomorrowHolidays.join("\n"));
					}
					tooltipText = parts.join("\n\n");
				} else {
					// Ищем ближайший праздник (прыгаем вперед до ~6 месяцев)
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

				// Сохраняем свежие данные в about:config
				Services.prefs.setStringPref(PREF_LAST, todayFull);
				Services.prefs.setStringPref(PREF_TEXT, tooltipText);

				dateEl.setAttribute("tooltiptext", tooltipText);

			} catch (err) {
				console.error("uc_dynamic_spring: Ошибка загрузки povod.json", err);

				// Если нет сети или упал GitHub, достаем старый текст (если он есть) и добавляем пометку
				try {
					let cachedText = Services.prefs.getStringPref(PREF_TEXT, "");
					if (cachedText) {
						dateEl.setAttribute("tooltiptext", cachedText + "\n\n[Нет сети. Данные устарели]");
					} else {
						dateEl.setAttribute("tooltiptext", "Не удалось загрузить праздники");
					}
				} catch(e) {}
			}
		},

		startMemoryPolling: function() {
			this.updateMemoryValue();
			setInterval(() => this.updateMemoryValue(), 3000);
			if (window.gBrowser) {
				window.gBrowser.tabContainer.addEventListener("TabSelect", () => this.updateMemoryValue());
			}
		},

		_timerId: null,
		_tabListenerAdded: false,

		startPolling: function() {
			if (this._timerId) return;
			// Первый замер без флага (считаем всё)
			this.updateModules(false);
			// Таймер обновляет всё
			this._timerId = setInterval(() => this.updateModules(false), 3000);

			if (window.gBrowser && !this._tabListenerAdded) {
				this._tabListenerAdded = true;
				// При клике на вкладку передаем флаг isTabSelect = true
				window.gBrowser.tabContainer.addEventListener("TabSelect", () => this.updateModules(true));
			}
		},

		startWeatherPolling: function() {
			setTimeout(() => this.updateWeatherValue(), 5000);
			setInterval(() => this.updateWeatherValue(), 180000);
		},

		startDatePolling: function() {
			this.updateDateValue();
			setTimeout(() => this.updateDateValue(), 5000);
			setInterval(() => this.updateDateValue(), 60000);
		}

	};

	if (gBrowserInit.delayedStartupFinished) {
		window.UCDynamicSpring.init();
	} else {
		let delayedListener = (subject, topic) => {
			if (topic == "browser-delayed-startup-finished" && subject == window) {
				Services.obs.removeObserver(delayedListener, topic);
				window.UCDynamicSpring.init();
			}
		};
		Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
	}
})();