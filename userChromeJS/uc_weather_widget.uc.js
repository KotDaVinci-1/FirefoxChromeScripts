// ==UserScript==
// @name			Погода
// @description		Виджет текущей температуры и прогноза погоды на панели браузера.
// @compatibility	Firefox 154
// @version			1.0.0 (релиз)
// @homepage		https://github.com/KotDaVinci-1/FirefoxChromeScripts
// ==/UserScript==

(function() {
	if (window.UCWeatherWidget) return;

	// --- ОФОРМЛЕНИЕ ---
	const STYLES = {
		base: `
			/* --- БАЗОВЫЕ СТИЛИ ВИДЖЕТА --- */
			#uc-weather-widget {
				align-self: center !important;
				height: calc(100% - 2px) !important;
				max-height: 28px !important;
				min-height: 22px !important;
				margin: 0 2px;
				box-sizing: border-box;
				font-size: 14px;
				font-weight: 500;
				color: light-dark(#444, #CCC);
				font-family: Segoe UI;
				background: light-dark(rgba(255, 255, 255, 0.2), rgba(0, 0, 0, 0.2));
				padding-inline: 6px;
				border-radius: 4px;
				display: flex;
				align-items: center;
				cursor: pointer;
			}

			#main-window[uidensity="touch"] #uc-weather-widget { max-height: 34px; }
			#main-window[uidensity="compact"] #uc-weather-widget { max-height: 30px; }
			#uc-weather-widget:hover { text-decoration: underline; }

			#uc-weather-widget #uc-weather-temp {margin: 0; cursor: pointer; display: flex; font-variant-numeric: tabular-nums; min-width: 5ch; justify-content: flex-end; line-height: 1;}

			/* --- ИКОНКИ В МЕНЮ --- */
			#uc-weather-context-menu menu[label="Стиль иконок"] > .menu-icon { content: url("chrome://browser/skin/weather/sunny.svg"); scale: 1.2; }
			#uc-weather-context-menu menu[label="Цвет текста"] > .menu-icon { content: url("chrome://global/skin/icons/edit-outline.svg"); }
			#uc-weather-context-menu menu[label="Размер шрифта"] > .menu-icon { content: url("chrome://global/skin/reader/character-spacing-20.svg"); }
			#uc-weather-context-menu menu[label="Фон виджета"] > .menu-icon { content: url("chrome://browser/skin/customize.svg"); }

			/* --- ИКОНКИ FIREFOX --- */
			@media not -moz-pref("uc.weather.widget.icons"), -moz-pref("uc.weather.widget.icons",2) {
				#uc-weather-widget .weather-icon { height: 24px; width: 24px; scale: 1.2; margin-right: 4px; display: none; }

				#uc-weather-widget .weather-icon.iconId1 { content: url("chrome://browser/skin/weather/sunny.svg"); scale: 0.94; }
				#uc-weather-widget .weather-icon.iconId2 { content: url("chrome://browser/skin/weather/mostly-sunny.svg"); scale: 1.4; }
				#uc-weather-widget .weather-icon:is(.iconId3, .iconId4, .iconId6) { content: url("chrome://browser/skin/weather/partly-sunny.svg"); scale: 1.28; bottom: -1px; position: relative; }
				#uc-weather-widget .weather-icon.iconId5 { content: url("chrome://browser/skin/weather/hazy-sunshine.svg"); scale: 1.14; }
				#uc-weather-widget .weather-icon:is(.iconId7, .iconId8) { content: url("chrome://browser/skin/weather/cloudy.svg"); scale: 1.3; }
				#uc-weather-widget .weather-icon.iconId11 { content: url("chrome://browser/skin/weather/fog.svg"); scale: 1.28; }
				#uc-weather-widget .weather-icon.iconId12 { content: url("chrome://browser/skin/weather/showers.svg"); top: -1px; position: relative; }
				#uc-weather-widget .weather-icon:is(.iconId13, .iconId14) { content: url("chrome://browser/skin/weather/mostly-cloudy-with-showers.svg"); scale: 1.12; bottom: -1px; position: relative; }
				#uc-weather-widget .weather-icon.iconId15 { content: url("chrome://browser/skin/weather/thunderstorms.svg"); }
				#uc-weather-widget .weather-icon:is(.iconId16, .iconId17) { content: url("chrome://browser/skin/weather/mostly-cloudy-with-thunderstorms.svg"); scale: 1.04; }
				#uc-weather-widget .weather-icon.iconId18 { content: url("chrome://browser/skin/weather/rain.svg"); scale: 1.12; top: -1px; position: relative; }
				#uc-weather-widget .weather-icon:is(.iconId19, .iconId20, .iconId25) { content: url("chrome://browser/skin/weather/flurries.svg"); scale: 1.12; }
				#uc-weather-widget .weather-icon.iconId21 { content: url("chrome://browser/skin/weather/partly-sunny-with-flurries.svg"); scale: 1.08; }
				#uc-weather-widget .weather-icon:is(.iconId22, .iconId23) { content: url("chrome://browser/skin/weather/snow.svg"); }
				#uc-weather-widget .weather-icon:is(.iconId24, .iconId31) { content: url("chrome://browser/skin/weather/ice.svg"); scale: 1; }
				#uc-weather-widget .weather-icon:is(.iconId26, .iconId29) { content: url("chrome://browser/skin/weather/freezing-rain.svg"); scale: 1.18; }
				#uc-weather-widget .weather-icon.iconId30 { content: url("chrome://browser/skin/weather/hot.svg"); scale: 1; }
				#uc-weather-widget .weather-icon.iconId32 { content: url("chrome://browser/skin/weather/windy.svg"); scale: 1.12; top: -1px; position: relative; }
				#uc-weather-widget .weather-icon.iconId33 { content: url("chrome://browser/skin/weather/night-clear.svg"); scale: 1.28; }
				#uc-weather-widget .weather-icon:is(.iconId34, .iconId35, .iconId36, .iconId38) { content: url("chrome://browser/skin/weather/night-mostly-clear.svg"); scale: 1.24; }
				#uc-weather-widget .weather-icon.iconId37 { content: url("chrome://browser/skin/weather/night-hazy-moonlight.svg"); }
				#uc-weather-widget .weather-icon:is(.iconId39, .iconId40) { content: url("chrome://browser/skin/weather/night-partly-cloudy-with-showers.svg"); }
				#uc-weather-widget .weather-icon:is(.iconId41, .iconId42) { content: url("chrome://browser/skin/weather/night-partly-cloudy-with-thunderstorms.svg"); }
				#uc-weather-widget .weather-icon:is(.iconId43, .iconId44) { content: url("chrome://browser/skin/weather/night-mostly-cloudy-with-flurries.svg"); }
			}
			/* --- ИКОНКИ ACCUWEATHER --- */
			@media -moz-pref("uc.weather.widget.icons",1) {
				#uc-weather-widget .weather-icon { content: var(--accu-icon); width: 24px; height: 24px; scale: 0.92; margin-right: 4px; display: none; }
				/* --- ГРУППЫ ПОДГОНКИ ИКОНОК --- */
				/* Смещение bottom */
				#uc-weather-widget .weather-icon:is(.iconId3, .iconId12, .iconId14, .iconId18, .iconId19, .iconId20, .iconId21, .iconId22, .iconId23, .iconId34, .iconId35, .iconId36, .iconId37, .iconId38) { bottom: -1px; position: relative; }
				/* scale: 1 */
				#uc-weather-widget .weather-icon:is(.iconId4, .iconId23, .iconId25, .iconId29, .iconId35, .iconId44) { scale: 1; }
				/* scale: 1.1 */
				#uc-weather-widget .weather-icon:is(.iconId5, .iconId8, .iconId34) { scale: 1.1; }
				/* scale: 1.3 */
				#uc-weather-widget .weather-icon.iconId6 { scale: 1.3; }
				/* scale: 1.2 */
				#uc-weather-widget .weather-icon.iconId7 { scale: 1.2; }
				/* scale: 0.96 */
				#uc-weather-widget .weather-icon.iconId13 { scale: 0.96; }
				/* scale: 0.9 */
				#uc-weather-widget .weather-icon:is(.iconId12, .iconId15, .iconId16, .iconId17, .iconId24, .iconId41, .iconId42, .iconId43) { scale: 0.9; }
				/* scale: 0.88 */
				#uc-weather-widget .weather-icon.iconId33 { scale: 0.88; }
			}

			/* --- Ч/Б ИКОНКИ FIREFOX --- */
			@media -moz-pref("uc.weather.widget.icons",2) {
				#uc-weather-widget .weather-icon { fill: light-dark( #222, #FFF); stroke: light-dark( #222, #FFF); -moz-context-properties: fill, stroke; }
			}

			/* --- БЕЗ ИКОНКИ --- */
			@media -moz-pref("uc.weather.widget.icons",3) { #uc-weather-widget .weather-icon { display: none !important; } }

			/* --- ЧЁРНЫЙ/БЕЛЫЙ ТЕКСТ--- */
			@media -moz-pref("uc.weather.widget.color",1) {
				#uc-weather-widget #uc-weather-temp { color: light-dark(black, white); }
			}

			/* --- ЦВЕТНОЙ ТЕКСТ --- */
			@media -moz-pref("uc.weather.widget.color",2) {
				#uc-weather-widget:has(.iconId1, .iconId2, .iconId3, .iconId4, .iconId5, .iconId6, .iconId33) #uc-weather-temp { color: light-dark(#e80, #fe5); }
				#uc-weather-widget:has(.iconId7, .iconId8, .iconId11, .iconId32, .iconId34, .iconId35, .iconId36, .iconId37, .iconId38) #uc-weather-temp { color: light-dark(#556, #bbc); }
				#uc-weather-widget:has(.iconId12, .iconId13, .iconId14, .iconId15, .iconId16, .iconId17, .iconId18, .iconId39, .iconId40, .iconId41, .iconId42) #uc-weather-temp { color: light-dark(#02f, #0bf); }
				#uc-weather-widget:has(.iconId19, .iconId20, .iconId21, .iconId22, .iconId23, .iconId24, .iconId25, .iconId26, .iconId29, .iconId31, .iconId43, .iconId44) #uc-weather-temp { color: light-dark(#72e, #a9f); }
				#uc-weather-widget:has(.iconId30) #uc-weather-temp { color: light-dark(#d40, #f80); }
			}

			/* --- ПРОЗРАЧНЫЙ ФОН --- */
			@media -moz-pref("uc.weather.widget.backgr",1) {
			#uc-weather-widget { background: unset; }
			}

			/* --- ЦВЕТНОЙ ФОН --- */
			@media -moz-pref("uc.weather.widget.backgr",2) {
				#uc-weather-widget:has(.iconId1, .iconId2, .iconId3, .iconId4, .iconId5, .iconId6, .iconId33) { background: light-dark(#fe7, #504400); }
				#uc-weather-widget:has(.iconId7, .iconId8, .iconId11, .iconId32, .iconId34, .iconId35, .iconId36, .iconId37, .iconId38) { background: light-dark(#cfcfcf, #3f3f40); }
				#uc-weather-widget:has(.iconId12, .iconId13, .iconId14, .iconId15, .iconId16, .iconId17, .iconId18, .iconId39, .iconId40, .iconId41, .iconId42) { background: light-dark(#8cf, #002f88); }
				#uc-weather-widget:has(.iconId19, .iconId20, .iconId21, .iconId22, .iconId23, .iconId24, .iconId25, .iconId26, .iconId29, .iconId31, .iconId43, .iconId44) { background: light-dark(#c7b2ff, #36207f); }
				#uc-weather-widget:has(.iconId30) { background: light-dark(#fc9, #610); }
			}

			/* --- ТЕМНАЯ ТЕМА ВСЕГДА --- */
			@media -moz-pref("uc.weather.widget.scheme") {
				#uc-weather-widget { color-scheme: dark !important; background: #1C2123; }
			}
			/* --- РАЗМЕР ШРИФТА --- */
			@media -moz-pref("uc.weather.widget.font",1) {
				#uc-weather-widget { font-size: 16px; }
			}
			@media -moz-pref("uc.weather.widget.font",2) {
				#uc-weather-widget { font-size: 18px; }
			}

			/* --- НАСЫЩЕННОСТЬ ШРИФТА --- */
			@media -moz-pref("uc.weather.widget.bold") {
				#uc-weather-widget { font-weight: 600; }
			}

			/* --- АВТОРАЗМЕРЫ ТЕКСТА И ИКОНКИ --- */
			@media -moz-pref("uc.weather.widget.autosize") {
				#uc-weather-widget #uc-weather-temp { font-size: calc(var(--widget-height) - 4px); }
				#main-window #uc-weather-widget { max-height: 32px !important; }
				#main-window[uidensity="touch"] #uc-weather-widget { max-height: 34px !important; }
				#main-window[uidensity="compact"] #uc-weather-widget { max-height: 30px !important; }
				@media not -moz-pref("uc.weather.widget.icons",3) {
					#uc-weather-widget .weather-icon { width: calc(var(--widget-height) + 2px); height: calc(var(--widget-height) + 2px); }
					#TabsToolbar #uc-weather-widget .weather-icon { max-height: calc(var(--tab-min-height) + 8px); max-width: calc(var(--tab-min-height) + 8px); } /*таб-бар fix*/
				}
			}

			/* --- УМЕНЬШЕННЫЕ ИКОНКИ --- */
			@media (not -moz-pref("uc.weather.widget.icons", 3)) and (-moz-pref("uc.weather.widget.icons_sm")) {
				#uc-weather-widget .weather-icon { padding: 1px; }
			}
		`
	};

	const UC_WEATHER_WIDGET_ID = "uc-weather-widget";
	window.UCWeatherWidget = {
		init: function() {
			let finalCSS = STYLES.base;

			let css = document.createElementNS("http://www.w3.org/1999/xhtml", "style");
			css.textContent = finalCSS;
			document.head.appendChild(css);

			try {
				Services.prefs.setBoolPref("browser.newtabpage.activity-stream.system.showWeather", true);
				Services.prefs.setBoolPref("browser.newtabpage.activity-stream.widgets.system.weatherForecast.enabled", true);
			} catch (e) {}

			const existingWeatherWidget = CustomizableUI.getWidget(UC_WEATHER_WIDGET_ID);
			if (!existingWeatherWidget || existingWeatherWidget.provider !== CustomizableUI.PROVIDER_API) {
				CustomizableUI.createWidget({
					id: UC_WEATHER_WIDGET_ID,
					type: "custom",
					defaultArea: CustomizableUI.AREA_NAVBAR,
					onBuild: function(aDocument) {
						let weatherBox = aDocument.createXULElement("toolbaritem");
						weatherBox.id = "uc-weather-widget";
						weatherBox.className = "chromeclass-toolbar-additional";
						weatherBox.setAttribute("label", "Погода");
						weatherBox.setAttribute("removable", "true");

						let weatherIcon = aDocument.createXULElement("image");
						weatherIcon.id = "uc-weather-icon";
						weatherIcon.className = "weather-icon";

						let weatherTemp = aDocument.createXULElement("label");
						weatherTemp.id = "uc-weather-temp";
						weatherTemp.setAttribute("value", "--°C");

						weatherBox.appendChild(weatherIcon);
						weatherBox.appendChild(weatherTemp);

						// Наблюдатель за реальной высотой элемента
						const ro = new aDocument.defaultView.ResizeObserver(entries => {
							for (let entry of entries) {
								entry.target.style.setProperty("--widget-height", `${entry.contentRect.height}px`);
							}
						});
						ro.observe(weatherBox);

						// ==========================================
						// --- СОЗДАНИЕ КОНТЕКСТНОГО МЕНЮ ---
						// ==========================================
						let contextMenu = aDocument.createXULElement("menupopup");
						contextMenu.id = "uc-weather-context-menu";
						weatherBox.appendChild(contextMenu);
						weatherBox.setAttribute("context", "uc-weather-context-menu");

						// Вспомогательная функция для радио-меню
						const createRadioMenu = (label, prefName, options) => {
							let menu = aDocument.createXULElement("menu");
							menu.setAttribute("label", label);
							menu.setAttribute("class", "menu-iconic");						
							
							let popup = aDocument.createXULElement("menupopup");
							menu.appendChild(popup);

							// Синхронизация checked состояния при открытии вложенного меню
							popup.addEventListener("popupshowing", () => {
								let currentVal = 0;
								try { currentVal = Services.prefs.getIntPref(prefName); } catch (e) {}
								
								for (let item of popup.children) {
									if (parseInt(item.getAttribute("value")) === currentVal) {
										item.setAttribute("checked", "");
									} else {
										item.removeAttribute("checked");
									}
								}
							});

							options.forEach(opt => {
								let item = aDocument.createXULElement("menuitem");
								item.setAttribute("type", "radio");
								item.setAttribute("name", prefName); // Группировка
								item.setAttribute("label", opt.label);
								item.setAttribute("value", opt.value);
								
								item.addEventListener("command", () => {
									Services.prefs.setIntPref(prefName, opt.value);
								});
								popup.appendChild(item);
							});
							
							return menu;
						};

						// Вспомогательная функция для чекбокса
						const createCheckbox = (label, prefName) => {
							let item = aDocument.createXULElement("menuitem");
							item.setAttribute("type", "checkbox");
							item.setAttribute("label", label);
							item.setAttribute("image", "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnLz4=");

							item.addEventListener("command", () => {
								let current = false;
								try { current = Services.prefs.getBoolPref(prefName); } catch (e) {}
								Services.prefs.setBoolPref(prefName, !current);
							});

							item.dataset.pref = prefName; 
							return item;
						};

						// 1. Иконки
						contextMenu.appendChild(createRadioMenu("Стиль иконок", "uc.weather.widget.icons", [
							{ label: "Цветные (Firefox)", value: 0 },
							{ label: "AccuWeather", value: 1 },
							{ label: "Монохромные", value: 2 },
							{ label: "Скрыть иконки", value: 3 }
						]));

						// 2. Цвет текста
						contextMenu.appendChild(createRadioMenu("Цвет текста", "uc.weather.widget.color", [
							{ label: "По умолчанию", value: 0 },
							{ label: "Черно-белый", value: 1 },
							{ label: "Цветной", value: 2 }
						]));

						// 3. Фон
						contextMenu.appendChild(createRadioMenu("Фон виджета", "uc.weather.widget.backgr", [
							{ label: "По умолчанию", value: 0 },
							{ label: "Прозрачный", value: 1 },
							{ label: "Цветной", value: 2 }
						]));

						// 4. Шрифт
						contextMenu.appendChild(createRadioMenu("Размер шрифта", "uc.weather.widget.font", [
							{ label: "14px (Стандартный)", value: 0 },
							{ label: "16px (Средний)", value: 1 },
							{ label: "18px (Крупный)", value: 2 }
						]));

						contextMenu.appendChild(aDocument.createXULElement("menuseparator"));

						// 5. Чекбоксы в корне
						let schemeItem = createCheckbox("Темная тема всегда", "uc.weather.widget.scheme");
						let boldItem = createCheckbox("Жирный шрифт", "uc.weather.widget.bold");
						let autoItem = createCheckbox("Авторазмеры", "uc.weather.widget.autosize");
						let icosmItem = createCheckbox("Уменьшенная иконка", "uc.weather.widget.icons_sm");
						
						contextMenu.appendChild(schemeItem);
						contextMenu.appendChild(boldItem);
						contextMenu.appendChild(autoItem);
						contextMenu.appendChild(icosmItem);

						// Синхронизация состояния чекбоксов при клике ПКМ (открытии главного меню)
						contextMenu.addEventListener("popupshowing", () => {
							[schemeItem, boldItem, autoItem, icosmItem].forEach(item => {
								try {
									if (Services.prefs.getBoolPref(item.dataset.pref)) {
										item.setAttribute("checked", "");
									} else {
										item.removeAttribute("checked");
									}
								} catch (e) { item.removeAttribute("checked"); }
							});
						// 2. Блокировка меню "Размер шрифта" при включенном авторазмере
							let fontSizeMenu = contextMenu.querySelector('menu[label="Размер шрифта"]');
							
							if (fontSizeMenu) {
								let isAuto = Services.prefs.getBoolPref("uc.weather.widget.autosize", false);
								
								if (isAuto) {
									fontSizeMenu.setAttribute("disabled", "");
								} else {
									fontSizeMenu.removeAttribute("disabled");
								}
							}
						// 3. Блокировка меню "Уменьшенная иконка" когда иконки отключены
							let icoSmallMenu = contextMenu.querySelector('menuitem[label="Уменьшенная иконка"]');

							if (icoSmallMenu) {
								let iconStyle = 0;
								try { 
									iconStyle = Services.prefs.getIntPref("uc.weather.widget.icons"); 
								} catch (e) {}
								
								// Блокируем, только если выбрано "Скрыть иконки" (значение 3)
								if (iconStyle === 3) {
									icoSmallMenu.setAttribute("disabled", "");
								} else {
									icoSmallMenu.removeAttribute("disabled");
								}
							}
						});
						// ==========================================
						// --- КОНЕЦ БЛОКА МЕНЮ ---
						// ==========================================

						// Запускаем первичное обновление только для этого документа
						setTimeout(() => window.UCWeatherWidget.updateWeatherValue(), 500);
						// ==========================================
						// --- ОБРАБОТКА КЛИКА ЛКМ (ОТКРЫТИЕ ПРОГНОЗА) ---
						// ==========================================
						weatherBox.addEventListener("click", (event) => {
							if (event.button === 0 && !event.target.closest("menupopup")) {
								let url = weatherBox.dataset.forecastUrl;
								if (url) {
									window.openTrustedLinkIn(url, "tab");
								}
							}
						});
						return weatherBox;
					}
				});

				this.startWeatherPolling();
			}
		},

		updateWeatherValue: async function() {
			// Ищем все экземпляры виджета (во всех открытых окнах)
			let widgets = [];
			let widgetWrapper = CustomizableUI.getWidget("uc-weather-widget");
			if (widgetWrapper && widgetWrapper.instances) {
				widgets = widgetWrapper.instances.map(instance => instance.node).filter(n => n);
			}

			if (!widgets.length) return;

			try {
				const weatherFile = PathUtils.join(PathUtils.profileDir, "activity-stream.weather_feed.json");
				if (!(await IOUtils.exists(weatherFile))) return;
				const data = await IOUtils.readJSON(weatherFile);

				let currentTempStr = "--°C";
				let iconId = null;

				// 1. Проверяем доступность основных блоков данных
				const hasSuggestions = Array.isArray(data?.weather?.suggestions) && data.weather.suggestions.length > 0;
				const suggestionsData = hasSuggestions ? data.weather.suggestions[0] : null;
				const currentConditions = suggestionsData?.current_conditions;
				const dailyForecast = suggestionsData?.forecast;

				const hasHourly = Array.isArray(data?.weather?.hourlyForecasts) && data.weather.hourlyForecasts.length > 0;
				const hourlyForecasts = hasHourly ? data.weather.hourlyForecasts : [];

				// Ссылка для клика (приоритет у основного блока, иначе берем из почасового)
				const forecastUrl = suggestionsData?.url || hourlyForecasts[0]?.url || "";

				// 2. Извлекаем текущую температуру и иконку
				if (currentConditions) {
					if (currentConditions.temperature?.c !== undefined) {
						let currentTemp = currentConditions.temperature.c;
						currentTempStr = `${currentTemp > 0 ? "+" + currentTemp : currentTemp}°C`;
					}
					iconId = currentConditions.icon_id;
				}

				// 3. Формируем тултип
				let tooltipLines = [];

				// А) Название города (выводим всегда, если доступно)
				let cityName = data?.locationData?.city;
				if (cityName) {
					tooltipLines.push(`📍 ${cityName}`);
					tooltipLines.push(""); 
				}

				// Б) Диапазон температур на сегодня (если есть suggestions)
				if (dailyForecast?.low?.c !== undefined && dailyForecast?.high?.c !== undefined) {
					let lowTemp = dailyForecast.low.c > 0 ? "+" + dailyForecast.low.c : dailyForecast.low.c;
					let highTemp = dailyForecast.high.c > 0 ? "+" + dailyForecast.high.c : dailyForecast.high.c;
					tooltipLines.push(`Сегодня:  от ${lowTemp}°C  до ${highTemp}°C`);
					tooltipLines.push(""); 
				}

				// В) Почасовой прогноз
				if (hasHourly) {
					tooltipLines.push("В ближайшие часы ожидается:");
					hourlyForecasts.forEach(hourData => {
						let date = new Date(hourData.epoch_date_time * 1000);
						let timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
						let tempValue = hourData.temperature.c;
						let tempStr = tempValue > 0 ? "+" + tempValue : String(tempValue);
						tempStr = tempStr.replace('-', '\u2212') + "°C";
						tempStr = tempStr.padStart(6, '\u2007');
						tooltipLines.push(`${timeStr}   ${tempStr}   •   ${hourData.summary}`);
					});
				}

				// Г) Текстовое описание на день
				if (dailyForecast?.summary) {
					if (tooltipLines.length > 0 && tooltipLines[tooltipLines.length - 1] !== "") {
						tooltipLines.push(""); 
					}
					tooltipLines.push(dailyForecast.summary);
				}

				// Д) Обработка неполных данных / системные предупреждения
				const isFullyLoaded = hasSuggestions && currentConditions;

				if (!isFullyLoaded) {
					// Разделительный пустой отступ перед блоком ошибки
					if (tooltipLines.length > 0 && tooltipLines[tooltipLines.length - 1] !== "") {
						tooltipLines.push(""); 
					}

					if (hasHourly) {
						// Сценарий 2: Есть почасовой, но нет текущей погоды
						tooltipLines.push("⚠️ Данные текущей погоды не получены");
						tooltipLines.push("Дождитесь автообновления или перезапустите браузер");
					} else {
						// Сценарий 1: Данных нет вовсе (только locationData)
						tooltipLines.push("⚠️ Данные погоды не получены");
						tooltipLines.push("Дождитесь автообновления или перезапустите браузер");
					}
				}

				let tooltipText = tooltipLines.join('\n');

				// 4. Обновляем DOM всех найденных виджетов
				widgets.forEach(weatherBox => {
					let tempEl = weatherBox.querySelector("#uc-weather-temp");
					let iconEl = weatherBox.querySelector("#uc-weather-icon");

					if (forecastUrl) {
						weatherBox.dataset.forecastUrl = forecastUrl;
					} else {
						delete weatherBox.dataset.forecastUrl;
					}

					if (tempEl) tempEl.setAttribute("value", currentTempStr);

					if (iconEl) {
						if (iconId) {
							iconEl.setAttribute("class", `weather-icon iconId${iconId}`);
							iconEl.style.setProperty('--accu-icon', `url("https://www.accuweather.com/images/weathericons/v2a/${iconId}.svg")`);
							iconEl.style.display = "block";
						} else {
							iconEl.setAttribute("class", "weather-icon");
							iconEl.style.display = "none";
						}
					}

					if (tooltipLines.length > 0) {
						weatherBox.setAttribute("tooltiptext", tooltipText);
					} else {
						weatherBox.removeAttribute("tooltiptext");
					}
				});

			} catch (e) {}
		},

		startWeatherPolling: function() {
			setTimeout(() => this.updateWeatherValue(), 5500);
			setInterval(() => this.updateWeatherValue(), 180000);
		}
	};

	if (gBrowserInit.delayedStartupFinished) {
		window.UCWeatherWidget.init();
	} else {
		let delayedListener = (subject, topic) => {
			if (topic == "browser-delayed-startup-finished" && subject == window) {
				Services.obs.removeObserver(delayedListener, topic);
				window.UCWeatherWidget.init();
			}
		};
		Services.obs.addObserver(delayedListener, "browser-delayed-startup-finished");
	}
})();