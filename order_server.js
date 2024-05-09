// MMS Modules Declare
const googleAPI = require('./mms_modules/google_map_api.js')
const orderScope = require('./mms_modules/google_map_scope.js')
const mmsDrinkFeed = require('./mms_modules/mms_drink_feed.js')
const mmsLineUser = require('./mms_modules/mms_line_user.js')
const mmsOrderStatus = require('./mms_modules/mms_order_status.js')
const mmsStoreMenu = require('./mms_modules/mms_store_menu.js')
const mmsStoreOrder = require('./mms_modules/mms_store_order.js')
const mmsStoreStatus = require('./mms_modules/mms_store_status.js')
const mmsUserDiscount = require('./mms_modules/mms_user_discount.js')
const mmsUserPoint = require('./mms_modules/mms_user_point.js')
const mmsRouletteLottery = require('./mms_modules/mms_roulette_lottery.js')
const mmsOperatingIncome = require('./mms_modules/mms_operating_income.js')
const mmsDisplayDevice = require('./mms_modules/mms_display_device.js')
// skip drink in order list check
let filter_drink = ['drink999']
// LINE Bot
const line = require('@line/bot-sdk')
// variable for LINE Bot config
let debugMode = 0
let config = {}
let callbackURL = ''
let httpsPort = 0
let mqttPort = 0
// 0 = formal mode; 1 = debug mode
if (debugMode) {
	config = {
		channelAccessToken: ${debugChannelAccessToken},
		channelSecret: ${debugChannelSecret}
	}
	callbackURL = 'https://test-micro-x2-sugar-291.com'
	httpsPort = 20201
	mqttPort = 20104
} else {
	config = {
		channelAccessToken: ${formalChannelAccessToken},
		channelSecret: ${formalChannelSecret}
	}
	callbackURL = 'https://micro-x2-sugar-291.com'
	httpsPort = 20101
	mqttPort = 20103
}
// LINE client for event function
const lineClient = new line.Client(config)
// LINE Pay
const libLinePay = require('./public/lib/line_pay')
const {v4 : uuidv4} = require('uuid')
const dateAndTime = require('date-and-time')
const bigNumber = require('bignumber.js')
// parameter for LINE Pay
const linePay = new libLinePay({
	channelId: ${linePayChannelId},
	channelSecret: ${linePayChannelSecret},
	url: ${linePayUrl}
})
// JKO Pay
const jkoPayStoreID = ${storeID}
const jkoPaySercertKey = ${sercertKey}
const jkoPayApiKey = ${apiKey}
// for HTTP request
const axios = require('axios')
// for pay
const crypto = require('crypto')
// for hex
const querystring = require("querystring");
// file system
const fs = require('fs')
// QR code for member
const QRCode = require('qrcode')
// HTTP service
const http = require('http')
const express = require('express')
const bodyParser = require('body-parser')
const urlencodedParser = bodyParser.urlencoded({ extended: false })
const app = express()
app.use(express.static('public'))
app.use(express.static('public/images'))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// HTTP service up and get menu of store
let mqttStoreStatus = 0
let storeMenu = []
const server = http.createServer(credentials, app).listen(httpsPort, () => {
	console.log('Express https server listening on port ', httpsPort)
	console.log('--- Store Close ---')

	if (!debugMode) {
		mqttStoreStatus = 0
		mmsStoreMenu.updateStoreStatus(mqttStoreStatus).then(res_store_status => {
			console.log('res_store_status: ', res_store_status)
		}).catch(error_store_status => {
			console.log('error_store_status: ', error_store_status)
		})
	}

	mmsStoreMenu.getDrinkMenu().then(res_drink_menu => {
		storeMenu = res_drink_menu
	}).catch(err_drink_menu => {
		console.log(err_drink_menu)
	})
})
//MQTT service
const mosca = require('mosca')
const mqttServer = new mosca.Server({
	port: mqttPort
})
mqttServer.attachHttpServer(server)
// MQTT client connected
mqttServer.on('clientConnected', function(client) {
	if (client.id == 'microX2Sugar291OrderReceive') {
		mqttStoreStatus = 1
		const sysDate = new Date()
		let sysTime = dateAndTime.format(sysDate, 'HHmm')

		sysTimeInt = parseInt(sysTime)
		console.log('System Time: ', sysTimeInt)

		if (sysTime >= 1000 && sysTime <= 2145) {
			mmsStoreMenu.updateStoreStatus(mqttStoreStatus).then(res_store_status => {
				console.log('res_store_status: ', res_store_status)
			}).catch(error_store_status => {
				console.log('error_store_status: ', error_store_status)
			})
		} else {
			console.log('--- Store Close ---')

			mmsStoreMenu.updateStoreStatus(mqttStoreStatus).then(res_store_status => {
				console.log('res_store_status: ', res_store_status)
			}).catch(error_store_status => {
				console.log('error_store_status: ', error_store_status)
			})
		}

		console.log('client connected: ', client.id)
	}
})
// MQTT client disconnected
mqttServer.on('clientDisconnected', function(client) {
	if (client.id == 'microX2Sugar291OrderReceive') {
		mqttStoreStatus = 0
		mmsStoreMenu.updateStoreStatus(mqttStoreStatus).then(res_store_status => {
			console.log('res_store_status: ', res_store_status)
		}).catch(error_store_status => {
			console.log('error_store_status: ', error_store_status)
		})

		console.log('Client Disconnected: ', client.id)
	}
});
// message was received
mqttServer.on('published', function(packet, client) {
	if (packet.payload == 'microX2Sugar291OrderReceive') {
		console.log('Published', packet.payload)
	}
})
// Triggered when the MQTT service is ready
function setup() {
	console.log('Mosca service is up and running')
}
mqttServer.on('ready', setup)
// schedule
const now = new Date()
const weekCheck = dateAndTime.format(now, 'dddd')
const schedule = require('node-schedule')
let scheduleRuleOpen = new schedule.RecurrenceRule()
let scheduleRuleClose = new schedule.RecurrenceRule()
let weekdayHoliday = ''
// business hours of store
switch (weekCheck) {
	case 'Tuesday':
	case 'Wednesday':
	case 'Thursday':
	case 'Friday':
		scheduleRuleOpen.dayOfWeek = [2, 3, 4, 5]
		scheduleRuleOpen.hour = 9
		scheduleRuleClose.minute = 0
		scheduleRuleClose.dayOfWeek = [2, 3, 4, 5]
		scheduleRuleClose.hour = 16
		scheduleRuleClose.minute = 45
		weekdayHoliday = 'weekday'
		break
	case 'Saturday':
	case 'Sunday':
		scheduleRuleOpen.dayOfWeek = [0, 6]
		scheduleRuleOpen.hour = 10
		scheduleRuleClose.minute = 0
		scheduleRuleClose.dayOfWeek = [0, 6]
		scheduleRuleClose.hour = 19
		scheduleRuleClose.minute = 45
		weekdayHoliday = 'holiday'
		break
	default:
		weekdayHoliday = 'weekday'
		break
}
// set store statue to open
schedule.scheduleJob(scheduleRuleOpen, function() {
	if (mqttStoreStatus == 1) {
		mmsStoreMenu.updateStoreStatus(mqttStoreStatus).then(res_store_status => {
			mmsDrinkFeed.reflashDrinkFeedStatus()
		}).catch(error_store_status => {
			console.log('error_store_status: ', error_store_status)
			mmsDrinkFeed.reflashDrinkFeedStatus()
		})
	}
})
// set store status to close
schedule.scheduleJob(scheduleRuleClose, function() {
	mqttStoreStatus = 0
	mmsStoreMenu.updateStoreStatus(mqttStoreStatus).then(res_store_status => {
		mmsDrinkFeed.reflashDrinkFeedStatus()
	}).catch(error_store_status => {
		console.log('error_store_status: ', error_store_status)
		mmsDrinkFeed.reflashDrinkFeedStatus()
	})

	mmsRouletteLottery.resetRouletteLottery()
	mmsRouletteLottery.deleteUserDiscount()
})
// get store status
schedule.scheduleJob('59 * * * * *', function() {
	mmsStoreStatus.getStoreStatus(weekdayHoliday).then(res_store_status => {
		const sysDate = new Date()
		let sysTime = dateAndTime.format(sysDate, 'HHmm')

		sysTimeInt = parseInt(sysTime)
	}).catch(error_store_status => {
		console.log(error_store_status)
	})
})
// callback for LINE Bot webhook
app.post('/callback', (req, res) => {
	Promise
	.all(req.body.events.map(handleEvent))
	.then((result) => res.json(result))
	.catch((err) => {
		console.error(err);
		res.status(500).end();
	})
})
// random for drink item
function getRandom(min, max){
	return Math.floor(Math.random() * (max - min + 1)) + min;
}
// LINE Bot event handler
function handleEvent(event) {
	lineClient.getProfile(event.source.userId).then(profile => {
		if (event.type == 'message') {
			mmsLineUser.saveLineUserProfile(profile).then(res_user_profile => {
				switch(event.message.text) {
					case '外送服務':
					case '預約店取':
						let oneself = ''
						let oneselfTag = 'no'

						if (event.message.text == '預約店取') {
							oneself = 'products'
							oneselfTag = 'yes'
						}

						let echo = {
							'type': 'flex',
							'altText': '歡迎光臨❤️微微糖・青埔形象店',
							'contents': {
								'type': 'carousel',
								'contents': [
									{},
									{},
									{},
									{
										"type": "bubble",
										"hero": {
											'type': 'image',
											'url': `${callbackURL}/full_drink_2160.jpg`,
											'margin': 'none',
											'size': 'full',
											'aspectRatio': '1920:2160',
											'aspectMode': 'cover'
										},
										"body": {
											"type": "box",
											"layout": "vertical",
											"spacing": "sm",
											"contents": [{
												"type": "button",
												"action": {
													"type": "uri",
													"label": "查看更多飲品",
													"uri": `${callbackURL}/${oneself}?q=${profile.userId}&openExternalBrowser=1&o=${oneselfTag}`
												},
												"style": "secondary",
												"gravity": "center"
											}]
										}
									}
								]
							}
						}
						let arr = []
						let randomNum = getRandom(0, Object.keys(storeMenu).length - 1)

						for (let i = 0; i < 3; i++) {
							let constant = {
								'type': 'bubble',
								'hero': {
									'type': 'image',
									'url': '',
									'margin': 'none',
									'size': 'full',
									'aspectRatio': '1280:1280',
									'aspectMode': 'cover'
								},
								'body': {
									'type': 'box',
									'layout': 'vertical',
									'spacing': 'sm',
									'contents': [{
										'type': 'box',
										'layout': 'baseline',
										'contents': [{
											'type': 'text',
											'text': '',
											'weight': 'bold',
											'size': 'xl',
											'wrap': true,
											'contents': []
										},
										{
											'type': 'text',
											'text': '',
											'weight': 'bold',
											'size': 'xl',
											'flex': 0,
											'wrap': true,
											'contents': []
										}]
									}]
								},
								'footer': {
									'type': 'box',
									'layout': 'vertical',
									'spacing': 'sm',
									'contents': [{
										'type': 'button',
										'action': {
											'type': 'uri',
											'label': '🛒 加入購物車',
											'uri': ''
										},
										'style': 'primary'
									}]
								}
							}

							for (let j = 0; j < arr.length; j++) {
								if (arr[j] == randomNum) {
									arr.splice(j, 1)
									i--
								}
							}

							arr.push(randomNum)

							let url = encodeURI(`${callbackURL}/${storeMenu[arr[i]].drink}.jpg`)
							let uri = encodeURI(`${callbackURL}/${oneself}?q=${profile.userId}&d=${storeMenu[randomNum].drink_id}&openExternalBrowser=1&o=${oneselfTag}`)

							constant.hero.url = url
							constant.body.contents[0].contents[0].text = storeMenu[arr[i]].drink
							constant.body.contents[0].contents[1].text = `$ ${storeMenu[arr[i]].drink_price}`
							constant.footer.contents[0].action.uri = uri
							echo.contents.contents[i] = constant
						}

						return lineClient.replyMessage(event.replyToken, echo)
						break

					case '點數查詢':
						let text = profile.userId
						let path = `./public/images/user_qr_code/${profile.userId}.jpg`

						fs.access(path, fs.constants.F_OK, (err) => {
							mmsUserPoint.selectUserPoint(profile.userId).then(res_user_point => {
								if (err) {
									let opts = {
										errorCorrectionLevel: 'H',
										version: 4,
										margin: 4,
										height: 1280,
										width: 1280
									}

									QRCode.toFile(path, text, opts, (err) => {
										if (err) {
											throw err
										}

										console.log(`${path} saved`)
									})
								}

								let echo = [{
									type: 'image',
									originalContentUrl: `${callbackURL}/user_qr_code/${profile.userId}.jpg`,
									previewImageUrl: `${callbackURL}/user_qr_code/${profile.userId}.jpg`
								},
								{
									type: 'text',
									text: `您好～\n\n您目前累積的點數為${res_user_point.userPoint}點\n集滿10點可兌換1杯50元飲品❤️（可補差價）`
								}]
								return lineClient.replyMessage(event.replyToken, echo)
							}).catch(err_user_point => {
								console.log(err_user_point)

								let echo = { type: 'text', text: '伺服器發生錯誤，請稍後再做嘗試' }
								return lineClient.replyMessage(event.replyToken, echo)
							})
						})
						break

					case '每日輪盤':
						let echoRoulette = {
							"type": "template",
							"altText": "每日輪盤",
							"template": {
								"type": "image_carousel",
								"columns": [{
									"imageUrl": `${callbackURL}/lucky_wheel_240.png`,
									"action": {
										"type": "uri",
										"label": "點我開始",
										"uri": `${callbackURL}/redirect?q=${profile.userId}`
									}
								}]
							}
						}

						return lineClient.replyMessage(event.replyToken, echoRoulette)
						break

					default:
						break
				}
			}).catch(err_user_profile => {
				console.log(err_user_profile)

				let echo = { type: 'text', text: '伺服器發生錯誤，請稍後再做嘗試' }
				return lineClient.replyMessage(event.replyToken, echo)
			})
		}
	}).catch(error => {
		console.log(error)
	})
}
// API for HTTP request
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/' + 'index.html')
})
app.get("/products", (req, res) => {
	res.sendFile(__dirname + '/' + 'index.html')
})
app.get('/cart', (req, res) => {
	res.sendFile(__dirname + '/' + 'index.html')
})
app.get('/checkout', (req, res) => {
	res.sendFile(__dirname + '/' + 'index.html')
})
app.get('/redirect', (req, res) => {
	res.sendFile(__dirname + '/' + 'index_roulette.html')
})
app.get('/declare', (req, res) => {
	res.sendFile(__dirname + '/' + 'index_roulette.html')
})
app.get('/roulette', (req, res) => {
	res.sendFile(__dirname + '/' + 'index_roulette.html')
})
app.get('/result', (req, res) => {
	res.sendFile(__dirname + '/' + 'result.html')
})
// 0 -> success
let responseWebResults = {'code_status' : '', 'response_data' : {}}
// error message
let message = {'message' : '伺服器錯誤 請致電(03)2871283'}
// response store status
app.get('/api/storeStatus', (req, res) => {
	mmsStoreStatus.getStoreStatus(weekdayHoliday).then(res_store_status => {
		if (debugMode) {
			res_store_status.response_data.storeIsOpen = true
		}
		
		res.json(res_store_status)
	}).catch(error_store_status => {
		console.log(error_store_status)

		let error = responseWebResults
		error.code_status = 2
		error.response_data = message

		console.log(error)
		res.json(error)
	})
})
// response store drink menu
app.get('/api/drinkMenu', (req, res) => {
	mmsStoreMenu.selectDrinkMenu().then(res_drink_menu => {
		console.log(res_drink_menu)
		res.json(res_drink_menu)
	}).catch(err_drink_menu => {
		console.log(err_drink_menu)

		let error = responseWebResults
		error.code_status = 2
		error.response_data = message

		console.log(error)
		res.json(error)
	})
})
// from user profile to get discount infromation
async function userDiscountAwait(userId, res) {
	const resultUserLineProfile = await getUserLineProfile(userId)

	if (!resultUserLineProfile) {
		userId = ''
	}

	mmsUserDiscount.getUserDiscount(userId, filter_drink).then(res_user_discount => {
		console.log(JSON.stringify(res_user_discount))
		res.json(res_user_discount)
	}).catch(error_user_discount => {
		console.log(error_user_discount)

		let error = responseWebResults
		error.code_status = 2
		error.response_data = message

		console.log(error)
		res.json(error)
	})
}
function getUserLineProfile(userId) {
	return new Promise((resolve, reject) => {
		lineClient.getProfile(userId).then(profile => {
			console.log(profile)
			resolve(true)
		}).catch(error => {
			console.log(JSON.stringify(error))
			resolve(false)
		})
	})
}
app.get('/api/userProfile', (req, res) => {
	console.log(req.query.q)
	getUserLineProfile(req.query.q, res)
})
app.get('/api/userDiscount', (req, res) => {
	console.log(req.query.q)
	userDiscountAwait(req.query.q, res)
})
// get order list and check information is correct
async function orderListAwait(orderList, res) {
	const resultOrderDrinkStatus = await getOrderDrinkStatus(orderList)

	if (resultOrderDrinkStatus.code_status == 0 && resultOrderDrinkStatus.response_data.message == '皆可販售') {

	} else {
		console.log(resultOrderDrinkStatus)
		res.json(resultOrderDrinkStatus)

		return
	}

	let discountContent = {}
	let resultOrderUserDiscount = await doubleConfirmOrderUserDiscount(orderList)

	if (resultOrderUserDiscount.code_status == 0) {
		discountContent = resultOrderUserDiscount.response_data
	}

	if (resultOrderUserDiscount == 1) {
		orderList.client_id = ''
	}

	if (resultOrderUserDiscount == 2 || resultOrderUserDiscount == 3) {
		orderList.discountId = ''
	}

	const resultConfirmOrderPrice = await doubleConfirmOrderPrice(orderList, discountContent)

	if (resultConfirmOrderPrice.code_status == 0 && resultConfirmOrderPrice.response_data.confirm_order_price == '驗證成功') {
		
	} else {
		console.log(resultConfirmOrderPrice)
		res.json(resultConfirmOrderPrice)

		return
	}

	if (orderList.map != null) {
		const geocodeResponse = await googleAPI.getGoogleGeocode(orderList.map.formatted_address)
		let geocodeJson = geocodeResponse.response_data

		if (geocodeResponse.code_status == 0 && geocodeJson.status == 'OK') {

		} else {
			let error = responseWebResults
			error.code_status = 2
			error.response_data = message
			res.json(error)

			return
		}

		if (JSON.stringify(geocodeJson.results[0].geometry.location) == JSON.stringify(orderList.map.location)) {

		} else {
			let error = responseWebResults
			error.code_status = 2
			error.response_data = message
			res.json(error)

			return
		}

		switch(orderScope.windingNumber(orderList.map.location.lat, orderList.map.location.lng)) {
			case 'out':
				const distanceResponse = await googleAPI.getGoogleDistance(orderList.map.formatted_address)
				let distanceJson = distanceResponse.response_data

				if (distanceResponse.code_status == 0 && distanceJson.status == 'OK') {

				} else {
					let error = responseWebResults
					error.code_status = 2
					error.response_data = message
					res.json(error)

					return
				}

				let distanceValue = distanceJson.rows[0].elements[0].distance.value / 1000
				let distancePrice = Math.ceil(distanceValue) * 100

				if (orderList.total_price >= distancePrice) {

				} else {
					let error = responseWebResults
					error.code_status = 2
					error.response_data = message
					res.json(error)

					return
				}
				break
			case 'in':
			case 'on':
				if (orderList.total_price >= 200) {

				} else {
					let error = responseWebResults
					error.code_status = 2
					error.response_data = message
					res.json(error)

					return
				}
				break
			default
				break
		}
	} else {
		orderList.map = {'address': null}
	}

	switch (orderList.payment) {
		case 'line':
			await sendLinePayRequest(orderList, res)
			break
		case 'jkos':
			await sendJkoPayRequest(orderList, res)
			break
		default:
			let error = responseWebResults
			error.code_status = 2
			error.response_data = message
			res.json(error)

			return
			break
	}
}
// check drink status can sell in order list is correct
function getOrderDrinkStatus(orderList) {
	return new Promise((resolve, reject) => {
		mmsDrinkFeed.getDrinkFeedStatus(orderList.drink_list).then(sell_status => {
			if (Object.keys(sell_status).length == 0) {
				const success = responseWebResults
				success.code_status = 0
				success.response_data = {'message' : '皆可販售'}
				resolve(success)
			} else {
				let orderListDrinkStatus = sell_status.slice(0, -1)
				orderListDrinkStatus = `${orderListDrinkStatus} 目前無法販售`

				let error = responseWebResults
				error.code_status = 1
				error.response_data = message
				resolve(error)
			}
		}).catch(err_sell_status => {
			let error = responseWebResults
			error.code_status = 2
			error.response_data = message
			resolve(error)
		})
	})
}
// check discount in order list is correct
function doubleConfirmOrderUserDiscount(orderList) {
	return new Promise((resolve, reject) => {
		mmsStoreOrder.checkOrderUserDiscount(orderList.client_id, orderList.discountId).then(check_order_user_discount => {
			let results = responseWebResults

			switch(check_order_user_discount) {
				case 0:
					resolve(0)
					break
				case 1:
					resolve(1)
					break
				case 2:
					resolve(2)
					break
				case 3:
					resolve(3)
					break
			}

			results.code_status = 0
			results.response_data = check_order_user_discount
			resolve(results)
		}).catch(error_order_user_discount => {
			let error = responseWebResults
			error.code_status = 1
			error.response_data = {'check_order_user_discount' : error_order_user_discount}
			resolve(error)
		})
	})
}
// check order list price is correct
function doubleConfirmOrderPrice(orderList, discountContent) {
	return new Promise((resolve, reject) => {
		let totalCount = 0
		let totalPrice = 0
		let filterCount = 0
		let filterPrice = 0

		for (let i = 0; i < Object.keys(orderList.drink_list).length; i++) {
			mmsStoreOrder.checkOrderDrinkPrice(orderList.drink_list[i].drink_id).then(check_order_drink_price => {
				if (orderList.drink_list[i].feed_selected != null) {
					if (orderList.drink_list[i].total_price == orderList.drink_list[i].count * (10 + check_order_drink_price.seriesPrice)) {
						totalCount = totalCount + orderList.drink_list[i].count
						totalPrice = totalPrice + orderList.drink_list[i].count * (10 + check_order_drink_price.seriesPrice)

						if (orderList.drink_list[i].drink_id == filter_drink[0]) {
							filterCount = filterCount + orderList.drink_list[i].count
							filterPrice = filterPrice + orderList.drink_list[i].count * (10 + check_order_drink_price.seriesPrice)
						}
					} else {
						let error = responseWebResults
						let message = {'message' : '加料金額 驗證錯誤 請致電(03)2871283'}
						error.code_status = 1
						error.response_data = message
						resolve(error)
					}
				} else {
					if (orderList.drink_list[i].total_price == orderList.drink_list[i].count * check_order_drink_price.seriesPrice) {
						totalCount = totalCount + orderList.drink_list[i].count
						totalPrice = totalPrice + orderList.drink_list[i].count * check_order_drink_price.seriesPrice

						if (orderList.drink_list[i].drink_id == filter_drink[0]) {
							filterCount = filterCount + orderList.drink_list[i].count
							filterPrice = filterPrice + orderList.drink_list[i].count * check_order_drink_price.seriesPrice
						}
					} else {
						let error = responseWebResults
						let message = {'message' : '品項金額 驗證錯誤 請致電(03)2871283'}
						error.code_status = 1
						error.response_data = message
						resolve(error)
					}
				}

				if (orderList.total_drink + orderList.total_bags == totalCount) {
					if (orderList.discountId != null && orderList.discountId == discountContent.discount_series_id) {
						let discountTotal = 0
						let discountPrice = 0

						if (filterPrice != 0) {
							totalPrice = totalPrice - filterPrice
						}

						if (discountContent.discount_series_condition == 0 || totalPrice >= discountContent.discount_series_condition) {
							if (discountContent.discount_series_content < 1) {
								discountTotal = Math.round(totalPrice * discountContent.discount_series_content)
							} else {
								discountTotal = totalPrice - discountContent.discount_series_content
							}

							if (discountPrice > discountContent.discount_series_max_price) {
								discountPrice = discountContent.discount_series_max_price
							} else {
								discountPrice = totalPrice - discountTotal
							}
						} else {
							orderList.discountId = ''
						}

						if (filterPrice != 0) {
							discountTotal = discountTotal + filterPrice
							totalPrice = totalPrice + filterPrice
						}

						if (orderList.total_price == discountTotal && orderList.discount == discountPrice) {

						} else {
							let error = responseWebResults
							let message = {'message' : '折扣金額 驗證錯誤 請致電(03)2871283'}
							error.code_status = 1
							error.response_data = message
							resolve(error)

							return
						}
					}

					if ((orderList.total_price + orderList.discount) == totalPrice) {
						let success = responseWebResults
						success.code_status = 0
						success.response_data = {'confirm_order_price' : '驗證成功'}
						resolve(success)
					} else {
						let error = responseWebResults
						let message = {'message' : '合計金額 驗證錯誤 請致電(03)2871283'}
						error.code_status = 1
						error.response_data = message
						resolve(error)
					}
				}
			}).catch(error_order_drink_price => {
				let error = responseWebResults
				let message = {'message' : '驗證錯誤 請致電(03)2871283'}
				error.code_status = 1
				error.response_data = message
				resolve(error)
			})
		}
	})
}
// request for LINE Pay
function sendLinePayRequest(orderList, res) {
	const requestDate = new Date()
	const requestDateTime = dateAndTime.format(requestDate, 'YYYYMMDDHHmmssSSS')
	let requestAmount = orderList.total_price
	let requestCurrency = 'TWD'
	const requestUUID = uuidv4().toUpperCase()
	const requestID = requestDateTime + Math.floor(Math.random() * 291).toString()
	let requestBody = {
		amount: requestAmount,
		currency: requestCurrency,
		orderId: requestUUID,
		packages: [{
			id: requestID,
			amount: requestAmount,
			products: [
			{
				name: '微微糖・青埔形象店',
				imageUrl: `${callbackURL}/micro_x2_sugar_291_logo.png`,
				quantity: 1,
				price: requestAmount
			}
			]
		}],
		redirectUrls: {
			confirmUrl: `${callbackURL}/line/pay/confirm`,
			cancelUrl: `${callbackURL}/line/pay/cancel`
		}
	}

	if (orderList.client_id != null) {
		requestBody.redirectUrls.cancelUrl = `${callbackURL}/line/pay/cancel/?q=${orderList.client_id}&openExternalBrowser=1`
	}

	let resRequestContent = {
		amount: requestAmount,
		currency: requestCurrency
	}

	mmsStoreOrder.createOrderItems(requestID, requestUUID, orderList.client_id, orderList, JSON.stringify(resRequestContent), 'linePay').then(res_order_items => {
		if (res_order_items == 200) {
			linePay.request(requestBody).then(resRequest => {
				if (resRequest.returnCode == '0000') {
					let success = responseWebResults
					let message = {'url' : resRequest.info.paymentUrl.web, 'id' : requestID}
					success.code_status = 0
					success.response_data = message
					res.json(success)
				} else {
					let error = responseWebResults
					error.code_status = 2
					error.response_data = message

					mmsOrderStatus.updateOrderErrorStatus(requestID, resRequest.returnCode, resRequest.returnMessage).then(response_message => {
						console.log(response_message)
					}).catch(error_response_message => {
						console.log(error_response_message)
					})
				}
			}).catch(errRequest => {
				let error = responseWebResults
				error.code_status = 2
				error.response_data = message
				res.json(error)
			})
		} else {
			let error = responseWebResults
			error.code_status = 2
			error.response_data = message
			res.json(error)
		}
	}).catch(err_order_items => {
		let error = responseWebResults
		error.code_status = 2
		error.response_data = message
		res.json(error)
	})
}
// request for JKO Pay
function sendJkoPayRequest(orderList, res) {
	const requestDate = new Date()
	const requestDateTime = dateAndTime.format(requestDate, 'YYYYMMDDHHmmssSSS')
	const requestID = requestDateTime + Math.floor(Math.random() * 291).toString()
	let requestAmount = orderList.total_price
	const requestUUID = uuidv4().toUpperCase()

	let requestBody = {
		'store_id': jkoPayStoreID,
		'platform_order_id': requestID,
		'currency': 'TWD',
		'total_price': requestAmount,
		'final_price': requestAmount,
		'result_display_url': `${callbackURL}/jkos/pay/confirm?transactionId=${requestUUID}`
	}

	const hmac = crypto.createHmac('sha256', jkoPaySercertKey)
	const hash = hmac.update(JSON.stringify(requestBody)).digest('hex')

	let config = {
		method: 'POST',
		url: 'https://onlinepay.jkopay.com/platform/entry',
		headers: {
			'API-KEY': jkoPayApiKey,
			DIGEST: hash,
			'Content-Type': 'application/json'
		},
		data: requestBody
	}

	let resRequestContent = {
		amount: requestAmount,
		currency: 'TWD'
	}

	mmsStoreOrder.createOrderItems(requestID, requestUUID, orderList.client_id, orderList, JSON.stringify(resRequestContent), 'jakoPay').then(res_order_items => {
		if (res_order_items == 200) {
			axios(config).then(function(response) {
				if (response.data.result == '000') {
					let success = responseWebResults
					let message = {'url': response.data.result_object.payment_url, 'id': requestID}
					success.code_status = 0
					success.response_data = message
					res.json(success)
				} else {
					let error = responseWebResults
					error.code_status = 2
					error.response_data = message

					mmsOrderStatus.updateOrderErrorStatus(requestID, response.data.result, response.data.message).then(response_message => {
						console.log(response_message)
					}).catch(error_response_message => {
						console.log(error_response_message)
					})
				}
			}).catch(function(response_error) {
				let error = responseWebResults
				error.code_status = 2
				error.response_data = message
				res.json(error)
			})
		}
	}).catch(err_order_items => {
		let error = responseWebResults
		error.code_status = 2
		error.response_data = message
		res.json(error)
	})
}
// execute it when user finish order list
app.post('/online/payment/request', urlencodedParser, (req, res) => {
	orderListAwait(req.body, res)
})
// use LINE Pay
app.get('/line/pay/confirm', urlencodedParser, (req, res) => {
	let uuid = req.query.orderId

	mmsStoreOrder.selectOrderConfirm(uuid).then(res_order_items => {
		linePay.confirm(res_order_items.orderConfirm, req.query.transactionId).then(resConfirm => {
			if (resConfirm.returnCode == '0000') {
				let packet = {
					topic: 'app/order/message',
					payload: JSON.stringify(res_order_items),
					qos: 1,
					retain: false
				}

				mqttServer.publish(packet, function() {
					console.log('MQTT broker message sent')
				})

				if (res_order_items.orderContent.client_id.length > 0) {
					let message = {
						type: 'text',
						text: `感謝您的訂購❤️\n\n您的訂單編號為：${res_order_items.orderUUID.slice(0, 5)}\n我們將會盡快準備您的飲品。\n\n若飲品於預定時間前完成，將會進行通知，謝謝。`
					}

					sendMessageToLineUser(res_order_items.orderContent.client_id, message)
					mmsUserDiscount.updateUserDiscount(res_order_items.orderContent.client_id, res_order_items.orderContent.discountId)
				}

				mmsOrderStatus.updateOrderErrorStatus(res_order_items.orderID, '0000', 'success').then(response_message => {
					console.log(response_message)
				}).catch(error_response_message => {
					console.log(error_response_message)
				})

				mmsOrderStatus.updateOrderStatus(res_order_items.orderID, 'paid').then(res_order_status => {
					console.log('/line/pay/confirm -> ' + res_order_status)
				}).catch(err_order_items => {
					console.log(err_order_items)
				})

				res.redirect('/result')
			} else {
				let error = responseWebResults
				error.code_status = 2
				error.response_data = message

				mmsOrderStatus.updateOrderErrorStatus(res_order_items.orderID, resConfirm.returnCode, resConfirm.returnMessage).then(response_message => {
					res.redirect('/result')
				}).catch(error_response_message => {
						res.redirect('/result')
				})
			}
		})
	}).catch(err_order_items => {
		let error = responseWebResults
		error.code_status = 2
		error.response_data = message
		res.json(error)
	})
})
// LINE Pay cancel
app.get('/line/pay/cancel', urlencodedParser, (req, res) => {
	if ((req.query.q).length > 0) {
		res.redirect(`/?q=${req.query.q}`)
	} else {
		res.redirect('/')
	}
})
// use JKO Pay
app.get('/jkos/pay/confirm', urlencodedParser, (req, res) => {
	let requestBody = {
		platform_order_ids: req.query.transactionId
	}

	const hmac = crypto.createHmac('sha256', jkoPaySercertKey)
	const hash = hmac.update(querystring.stringify(requestBody)).digest('hex')

	let config = {
		method: 'GET',
		url: `https://onlinepay.jkopay.com/platform/inquiry?platform_order_ids=${req.query.transactionId}`,
		headers: {
			'API-KEY': jkoPayApiKey,
			DIGEST: hash,
			'Content-Type': 'application/json'
		}
	}

	let returnCode = '9999'

	mmsStoreOrder.selectOrderConfirm(req.query.transactionId).then(res_order_items => {
		axios(config).then(function(response) {
			switch(response.data.result) {
				case '000':
					returnCode = '0000'
					break
				case '999':
					break
				default:
					returnCode = '1' + response.data.result
					break
			}

			if (returnCode == '0000') {
				let packet = {
					topic: 'app/order/message',
					payload: JSON.stringify(res_order_items),
					qos: 1,
					return: false
				}

				mqttServer.publish(packet, function() {
					console.log('MQTT broker message sent')
				})

				if (res_order_items.orderContent.client_id.length > 0) {
					let message = {
						type: 'text',
						text: `感謝您的訂購❤️\n\n您的訂單編號為：${res_order_items.orderUUID.slice(0, 5)}\n我們將會盡快準備您的飲品。\n\n若飲品於預定時間前完成，將會進行通知，謝謝。`
					}

					sendMessageToLineUser(res_order_items.orderContent.client_id, message)
					mmsUserDiscount.updateUserDiscount(res_order_items.orderContent.client_id, res_order_items.orderContent.discountId)
				}

				mmsOrderStatus.updateOrderErrorStatus(res_order_items.orderID, '0000', 'success').then(response_message => {
					console.log(response_message)
				}).catch(error_response_message => {
					console.log(error_response_message)
				})

				mmsOrderStatus.updateOrderStatus(res_order_items.orderID, 'paid').then(res_order_status => {
					console.log(res_order_status)
				}).catch(err_order_items => {
					console.log(err_order_items)
				})

				res.redirect('/result')
			} else {
				let error = responseWebResults
				error.code_status = 2
				error.response_data = message

				mmsOrderStatus.updateOrderErrorStatus(res_order_items.orderID, returnCode, response.data.message).then(response_message => {
					res.redirect('/result')
				}).catch(error_response_message => {
					res.redirect('/result')
				})
			}
		}).catch(function(response_error) {
			console.log(response_error)
		})
	}).catch(err_order_items => {
		let error = responseWebResults
		error.code_status = 2
		error.response_data = message
		res.json(error)
	})
})
// response order list status
app.get('/api/result', (req, res) => {
	mmsOrderStatus.selectOrderErrorStatus(req.query.q).then(res_order_status => {
		let success = responseWebResults
		let errorCode = {'errorCode' : `${res_order_status.order_series_return_code}`}
		success.code_status = 0
		success.response_data = errorCode

		res.json(success)
	}).catch(err_order_status => {
		let error = responseWebResults
		error.code_status = 2
		error.response_data = message
		res.json(error)
	})
})
// get order list pay status
app.get('/api/payStatus', (req, res) => {
	mmsStoreStatus.getPayStatus().then(res_pay_status => {
		res.json(res_pay_status)
	}).catch(error_pay_status => {
		let error = responseWebResults
		error.code_status = 2
		error.response_data = message
		res.json(error)
	})
})
// get order list information for APP
app.get('/api/getOrderList', (req, res) => {
	mmsStoreOrder.getOrderListData().then(res_order_list => {
		res.json(res_order_list)
	}).catch(error_order_list => {

	})
})
// get store manu for APP
app.get('/api/pickerMenu', (req, res) => {
	mmsStoreMenu.pickerGroupMenu().then(res_picker_menu => {
		res.json(res_picker_menu)
	}).catch(err_picker_menu => {

	})
})
// get drink of menu for APP
app.get('/api/getDrinkItems', (req, res) => {
	mmsDrinkFeed.getDrinkItems(req.query.seriesID).then(res_drink_items => {
		res.json(res_drink_items)
	}).catch(err_drink_items => {

	})
})
// update order list status from APP
app.post('/app/order/status', urlencodedParser, (req, res) => {
	let responseMsgArray = []

	mmsOrderStatus.updateOrderStatus(req.body.orderID, req.body.orderStatus).then(res_order_status => {
		res.status(res_order_status).json(responseMsgArray)
	}).catch(err_order_status => {
		res.status(500).json(responseMsgArray)
	})
})
// set drink status from APP
app.post('/app/drink/status', urlencodedParser, (req, res) => {
	let responseMsgArray = []

	mmsDrinkFeed.setDrinkStatus(req.body.seriesID, req.body.seriesSell, req.body.seriesDeadline).then(res_drink_status => {
		res.status(res_drink_status).json(responseMsgArray)
	}).catch(err_drink_status => {
		res.status(500).json(responseMsgArray)
	})
})
// select how many point is user have
app.get('/app/user/select/user/point', urlencodedParser, (req, res) => {
	mmsUserPoint.selectUserPoint(req.body.client_id).then(res_user_point => {
		res.status(200).json(res_user_point)
	}).catch(err_user_point => {
		res.status(404).json([])
	})
})
// process pint for user
app.post('/app/user/process/user/point', urlencodedParser, (req, res) => {
	mmsUserPoint.processUserPoint(req.body.client_id, req.body.credit_price, req.body.discount_point).then(res_user_point => {
		if (req.body.credit_price == 0) {
			let pointAfter = req.body.discount_point + res_user_point.processUserPoint.userPoint
			let message = {
				type: 'text',
				text: `您好～\n\n您此次消費為您扣除${req.body.discount_point}點。扣除前為${pointAfter}點，扣除後為${res_user_point.processUserPoint.userPoint}點。`
			}

			sendMessageToLineUser(req.body.client_id, message)
		} else {
			const pointMessage = parseInt(req.body.credit_price / 50)
			let pointBefore = res_user_point.processUserPoint.userPoint - pointMessage
			let message = {
				type: 'text',
				text: `您好～\n\n您此次消費金額為${req.body.credit_price}元，為您累積${pointMessage}點。累積前為${pointBefore}點，累積後為${res_user_point.processUserPoint.userPoint}點。`
			}

			sendMessageToLineUser(req.body.client_id, message)
		}

		res.status(res_user_point.successCode).json(res_user_point.processUserPoint)
	}).catch(err_user_point => {
		res.status(404).json([])
	})
})
// send message to user with LINE
function sendMessageToLineUser(clientId, message) {
	lineClient.pushMessage(clientId, message).then(() => {

	}).catch((err) => {

	})
}
