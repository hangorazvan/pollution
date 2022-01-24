/* Magic Mirror
 * Module: Air Pollution OpenWeatherMap
 *
 * Redesigned by Răzvan Cristea
 * https://github.com/hangorazvan
 */
Module.register("pollution", {
	// Default module config.
	defaults: {
		lat: "",
		lon: "",
		location: "",
		appid: "",
		units: config.units,
		dayUpdateInterval: 10 * 60 * 1000, // every 10 minutes
		nightUpdateInterval: 15 * 60 * 1000, // every 15 minutes
		initialLoadDelay: 0, // 0 seconds delay
		retryDelay: 2000,
		animationSpeed: 1000,
		timeFormat: config.timeFormat,
		language: config.language,
		decimalSymbol: ".",
		appendLocationNameToHeader: true,
		useLocationAsHeader: false,
		
		calculateAqi: true,			// calculate AQI from pollutants concentration
		showAqiTime: time,			// show last update time
		showAqiData: true,			// show AQI calculation pollutants, hidding last update
		showPollution: false,		// snow list of all pollutants, hidding AQI calculationt of all pollutants
	},

	// Define required scripts.
	getScripts: function () {
		return ["moment.js"];
	},

	// Define required scripts.
	getStyles: function () {
		return ["pollution.css", "font-awesome.css"];
	},

	// Define required translations.
	getTranslations: function () {
        return {
            en: "en.json",
            ro: "ro.json"
        };
	},

	// Define start sequence.
	start: function () {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(this.config.language);

		this.aqi = null;	 			// Air Quality
		this.aqi_t = null;
		this.c_co = null;
		this.c_no = null;
		this.c_no2 = null;
		this.c_o3 = null;
		this.c_so2 = null;
		this.c_pm25 = null;
		this.c_pm10 = null;
		this.c_nh3 = null;

		this.loaded = false;
		this.scheduleUpdate(this.config.initialLoadDelay);
		this.updateTimer = null;
	},

	// Override dom generator.
	getDom: function () {
		if (this.config.appid === "") {
			var wrapper = document.createElement("div");
			wrapper.innerHTML = "Please set the correct openweather <i>appid</i> in the config for module: " + this.name + ".";
			wrapper.className = "dimmed light small";
			return wrapper;
		}
			
		if (!this.loaded) {
			var wrapper = document.createElement("div");
			wrapper.innerHTML = this.translate("LOADING");
			wrapper.className = "dimmed light small";
			return wrapper;
		} 

		var wrapper = document.createElement("div");
		wrapper.className = "airpollution";

		/*
		Quality   Index     Sub-index   CAQI calculation from highest pollutant concentration in μg/m3

		                                O3          NO2         PM10        PM25         SO2         NH3        CO

		Good        1       0-25        0-60        0-50        0-25        0-15         0-50        0-200      0-5000
		Fair        2       25-50       60-120      50-100      25-50       15-30        50-100      200-400    5000-7500
		Moderate    3       50-75       120-180     100-200     50-90       30-55        100-350     400-800    7500-10000
		Poor        4       75-100      180-240     200-400     90-180      55-110       350-500     800-1600   10000-20000
		Unhealty    5       > 100       > 240       > 400       > 180       > 110        > 500       > 1600     > 20000

		Source: https://www.airqualitynow.eu/download/CITEAIR-Comparing_Urban_Air_Quality_across_Borders.pdf
		*/

		var aqi = document.createElement("div");
		aqi.className = "normal medium aqi bright";
		var aqi_q = null; var aqi_c = null;
		if (this.config.calculateAqi) {
			var aqi_i = null;
			aqi_i = Math.max(
				this.c_no2/4,       // mandatory
				this.c_no/4,        // optional
				this.c_pm10/1.8,    // mandatory 
				this.c_o3/2.4,      // mandatory
				this.c_pm25/1.1,    // optional
				this.c_so2/5,       // optional
				this.c_nh3/16,      // optional
				this.c_co/200       // optional
			).toFixed(0);
			if (aqi_i <= 25 
				|| this.c_no2 <= 50 
				|| this.c_no <= 50 
				|| this.c_pm10 <= 25 
				|| this.c_o3 <= 60 
				|| this.c_pm25 <= 15 
				|| this.c_co <= 5000 
				|| this.c_so2 <= 50 
				|| this.c_nh3 <= 200) {
				aqi_q = this.translate("Good");
				aqi_c = "lime";
			} else if (aqi_i > 25 
				|| this.c_no2 > 50 
				|| this.c_no > 50 
				|| this.c_pm10 > 25 
				|| this.c_o3 > 60 
				|| this.c_pm25 > 15	
				|| this.c_co > 5000	
				|| this.c_so2 > 50 
				|| this.c_nh3 > 200) {
				aqi_q = this.translate("Fair");
				aqi_c = "yellow";
			} else if (aqi_i > 50 
				|| this.c_no2 > 100 
				|| this.c_no > 100 
				|| this.c_pm10 > 50 
				|| this.c_o3 > 120 
				|| this.c_pm25 > 30 
				|| this.c_co > 7500 
				|| this.c_so2 > 100 
				|| this.c_nh3 > 400) {
				aqi_q = this.translate("Moderate");
				aqi_c = "orange";
			} else if (aqi_i > 75 
				|| this.c_no2 > 200 
				|| this.c_no > 200 
				|| this.c_pm10 > 90 
				|| this.c_o3 > 180 
				|| this.c_pm25 > 55 
				|| this.c_co > 10000 
				|| this.c_so2 > 350 
				|| this.c_nh3 > 800) {
				aqi_q = this.translate("Poor");
				aqi_c = "orangered";
			} else if (aqi_i > 100 
				|| this.c_no2 > 400 
				|| this.c_no > 400 
				|| this.c_pm10 > 180 
				|| this.c_o3 > 240 
				|| this.c_pm25 > 110 
				|| this.c_co > 20000 
				|| this.c_so2 > 500 
				|| this.c_nh3 > 1600) {
				aqi_q = this.translate("Unhealty");
				aqi_c = "red";
			}

			aqi.innerHTML = this.translate("Index") + " <i class=\"fa fa-leaf " + aqi_c + "\"></i> <span class=" + aqi_c + ">" + aqi_q + " (" + aqi_i + ")</span>";
		} else {
			if (this.aqi == 1) { 
				aqi_q = this.translate("Good");
				aqi_c = "lime";
			} else if (this.aqi == 2) { 
				aqi_q = this.translate("Fair");
				aqi_c = "yellow";
			} else if (this.aqi == 3) { 
				aqi_q = this.translate("Moderate");
				aqi_c = "orange";
			} else if (this.aqi == 4) { 
				aqi_q = this.translate("Poor");
				aqi_c = "orangered";
			} else if (this.aqi == 5) { 
				aqi_q = this.translate("Unhealty");
				aqi_c = "red";
			}

			aqi.innerHTML = this.translate("Index") + " <i class=\"fa fa-leaf " + aqi_c + "\"></i> <span class=" + aqi_c + ">" + aqi_q + " (" + this.aqi + ")</span>";
		}
		wrapper.appendChild(aqi);

		if (this.config.showAqiData && !this.config.showPollution) {
			var aqi_d = document.createElement("div");
			aqi_d.className = "normal small aqi_d";
			if (this.config.calculateAqi) {
    			aqi_d.innerHTML = "O<sub>3</sub> <span class=bright>" + (this.c_o3/2.4).toFixed(0)
    				+ "</span>; PM<sub>10</sub> <span class=bright>" + (this.c_pm10/1.8).toFixed(0)
    				+ "</span>; PM<sub>2.5</sub> <span class=bright>" + (this.c_pm25/1.1).toFixed(0)
    				+ "</span>; NO<sub>2</sub> <span class=bright>" + (this.c_no2/4).toFixed(0)
    				+ "</span>; SO<sub>2</sub> <span class=bright>" + (this.c_so2/5).toFixed(0)
    				+ "</span>";
			} else {
    			aqi_d.innerHTML = "O<sub>3</sub> <span class=bright>" + this.c_o3.toFixed(0).replace(".", this.config.decimalSymbol)
    				+ "</span>; PM<sub>10</sub> <span class=bright>" + this.c_pm10.toFixed(0).replace(".", this.config.decimalSymbol)
    				+ "</span>; PM<sub>2.5</sub> <span class=bright>" + this.c_pm25.toFixed(0).replace(".", this.config.decimalSymbol)
    				+ "</span>; NO<sub>2</sub> <span class=bright>" + this.c_no2.toFixed(0).replace(".", this.config.decimalSymbol)
    				+ "</span>; SO<sub>2</sub> <span class=bright>" + this.c_so2.toFixed(0).replace(".", this.config.decimalSymbol)
    				+ "</span>";
			}
			wrapper.appendChild(aqi_d);

		} else if (this.config.showAqiTime) {
			var aqi_t = document.createElement("div");
			aqi_t.className = "shade small aqi_t";
			aqi_t.innerHTML = this.translate("Update") + this.aqi_t + ", " + this.config.location;
			wrapper.appendChild(aqi_t);
		}
			
		if (this.config.showPollution) {
			this.config.showAqiData = false;
			var spacer = document.createElement("br");
			wrapper.appendChild(spacer);

			var c_o3 = document.createElement("div");
			c_o3.className = "normal small c_o3";
			c_o3.innerHTML = "Ozone (O<sub>3</sub>) <span class=bright>" + this.c_o3.toFixed(2).replace(".", this.config.decimalSymbol) + " µg/m³</span>";
			wrapper.appendChild(c_o3);

			var c_pm10 = document.createElement("div");
			c_pm10.className = "normal small c_pm10";
			c_pm10.innerHTML = "10μm particle (PM<sub>10</sub>) <span class=bright>" + this.c_pm10.toFixed(2).replace(".", this.config.decimalSymbol) + " µg/m³</span>";
			wrapper.appendChild(c_pm10);

			var c_pm25 = document.createElement("div");
			c_pm25.className = "normal small c_pm25";
			c_pm25.innerHTML = "2.5μm particle (PM<sub>2.5</sub>) <span class=bright>" + this.c_pm25.toFixed(2).replace(".", this.config.decimalSymbol) + " µg/m³</span>";
			wrapper.appendChild(c_pm25);

			var c_no2 = document.createElement("div");
			c_no2.className = "normal small c_no2";
			c_no2.innerHTML = "Nitrogen dioxide (NO<sub>2</sub>) <span class=bright>" + this.c_no2.toFixed(2).replace(".", this.config.decimalSymbol) + " µg/m³</span>";
			wrapper.appendChild(c_no2);

			var c_no = document.createElement("div");
			c_no.className = "normal small c_no";
			c_no.innerHTML = "Nitrogen monoxide (NO) <span class=bright>" + this.c_no.toFixed(2).replace(".", this.config.decimalSymbol) + " µg/m³</span>";
			wrapper.appendChild(c_no);

			var c_so2 = document.createElement("div");
			c_so2.className = "normal small c_so2";
			c_so2.innerHTML = "Sulphur dioxide (SO<sub>2</sub>) <span class=bright>" + this.c_so2.toFixed(2).replace(".", this.config.decimalSymbol) + " µg/m³</span>";
			wrapper.appendChild(c_so2);

			var c_co = document.createElement("div");
			c_co.className = "normal small c_co";
			c_co.innerHTML = "Carbon monoxide (CO) <span class=bright>" + this.c_co.toFixed(2).replace(".", this.config.decimalSymbol) + " µg/m³</span>";
			wrapper.appendChild(c_co);

			var c_nh3 = document.createElement("div");
			c_nh3.className = "normal small c_nh3";
			c_nh3.innerHTML = "Ammonia (NH<sub>3</sub>) <span class=bright>" + this.c_nh3.toFixed(2).replace(".", this.config.decimalSymbol) + " µg/m³</span>";
			wrapper.appendChild(c_nh3);
		}

		return wrapper;
	},

	// Override getHeader method.
	getHeader: function () {
		if (this.config.useLocationAsHeader && this.config.location !== false) {
			return this.config.location;
		}

		if (this.config.appendLocationNameToHeader) {
			if (this.data.header) return this.data.header + " " + this.config.location;
		}

		return this.data.header ? this.data.header : "";
	},

	// Override notification handler.
	notificationReceived: function (notification, payload, sender) {
		if (notification === "DOM_OBJECTS_CREATED") {
			if (this.config.appendLocationNameToHeader) {
				this.hide(0, { lockString: this.identifier });
			}
		}
	},

	/* updateAir (Air Quality Index)
	 * Requests new data from openweathermap.org.
	 * Calls processAir on succesfull response.
	 */
	updateAir: function () {
		if (this.config.appid === "") {
			Log.error("Air Pollution: APPID not set!");
			return;
		}

		var url = "https://api.openweathermap.org/data/2.5/air_pollution?lat=" + this.config.lat + "&lon=" + this.config.lon + "&appid=" + this.config.appid;
		var self = this;
		var retry = true;

		var airRequest = new XMLHttpRequest();
		airRequest.open("GET", url, true);
		airRequest.onreadystatechange = function () {
			if (this.readyState === 4) {
				if (this.status === 200) {
					self.processAir(JSON.parse(this.response));
				} else if (this.status === 401) {
					self.updateDom(self.config.animationSpeed);
					self.config.appid = self.config.backup;
					retry = true;
				} else {
					Log.error(self.name + ": Incorrect APPID. Could not load Air Pollution.");
				}

				if (retry) {
					self.scheduleUpdate(self.loaded ? -1 : self.config.retryDelay);
				}
			}
		};
		airRequest.send();
	},

	/* processAir(data)
	 * Uses the received data to set the various values.
	 *
	 * argument data object - air quality information received form openweathermap.org.
	 */
	processAir: function (data, momenttz) {
		if (!data || !data.list === "undefined") {
			return;
		}

		var mom = momenttz ? momenttz : moment; // Exception last.

		this.aqi = data.list[0].main.aqi;
		this.aqi_t = mom(data.list[0].dt, "X").format("HH:mm");
		if (data.list[0].hasOwnProperty("components")) {
			var aqi_p = data.list[0].components;
			this.c_co = aqi_p.co;
			this.c_no = aqi_p.no;
			this.c_no2 = aqi_p.no2;
			this.c_o3 = aqi_p.o3;
			this.c_so2 = aqi_p.so2;
			this.c_pm25 = aqi_p.pm2_5;
			this.c_pm10 = aqi_p.pm10;
			this.c_nh3 = aqi_p.nh3;
		}

		if (!this.loaded) {
			this.show(this.config.animationSpeed, { lockString: this.identifier });
			this.loaded = true;
		}

		this.updateDom(this.config.animationSpeed);
		this.sendNotification("CURRENTWEATHER_TYPE", { type: "AQI_" + this.aqi });
	},

	/* scheduleUpdate()
	 * Schedule next update.
	 *
	 * argument delay number - Milliseconds before next update. If empty, this.config.dayUpdateInterval is used.
	 */
	scheduleUpdate: function (delay) {
		var now = moment().format("HH:mm:ss");
		var updateInterval = null;

		if (now >= "07:00:00" && now <= "23:59:59") {
			updateInterval = this.config.dayUpdateInterval;
		} else {
			updateInterval = this.config.nightUpdateInterval;
		}

		var nextLoad = updateInterval;
		if (typeof delay !== "undefined" && delay >= 0) {
			nextLoad = delay;
		}

		var self = this;
		clearTimeout(this.updateTimer);
		this.updateTimer = setTimeout(function () {
			self.updateAir();
		}, nextLoad);
	}
});