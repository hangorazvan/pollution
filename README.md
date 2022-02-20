# Pollution (OpenWeatherMap/Air_Pollution)

[![Platform](https://img.shields.io/badge/platform-MagicMirror-informational)](https://MagicMirror.builders)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/hangorazvan/MagicMirror2/blob/master/LICENSE)

https://github.com/hangorazvan/pollution

MagicMirror2 stand alone module based on Openweathermap Air Pollution also included in Onecall module https://github.com/hangorazvan/onecall
<br>Keep in mind that this module is for my personal use with specific css styling or settings and not necessarily for sharing so don't create issues or pull requests.

#### Air Quality Index

<img src=https://github.com/hangorazvan/pollution/blob/master/aqi.png>

	{
		module: "pollution",
		position: "top_right",
		header: "Air Quality Index",
		classes: "air quality",
		disabled: false,
		config: {
			lat: "",				// your location latitude,
			lon: "",				// your location longitude,
			appid: "",				// your openweathermap API key,
			calculateAqi: true,			// calculate AQI from pollutants concentration
			showAqiTime: true,			// show last update time
			showAqiData: true,			// show AQI calculation pollutants, hidding last update
			showPollution: false,			// snow list of all pollutants, hidding AQI calculation of all pollutants
		}
	},

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

Air Quality compliments to put in your config.js
<br>You need to use my compliments_plus to work with AQI compliments
https://github.com/hangorazvan/compliments_plus

	compliments: {
		AQI_1 : [
			 "<i class=\"fa fa-leaf lime\"></i> Air Quality Good",
		],
		AQI_2 : [
			 "<i class=\"fa fa-leaf yellow\"></i> Air Quality Fair",
			],
		AQI_3 : [
			 "<i class=\"fa fa-leaf orange\"></i> Air Quality Moderate",
		],
		AQI_4 : [
			 "<i class=\"fa fa-leaf orangered\"></i> Air Quality Poor",
		],
		AQI_5 : [
			 "<i class=\"fa fa-leaf redrf\"></i> Air Quality Unhealty",
		],			
	}

Designed by Răzvan Cristea
https://github.com/hangorazvan
Creative Commons BY-NC-SA 4.0, Romania.
