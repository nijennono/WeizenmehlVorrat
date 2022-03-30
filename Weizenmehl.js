let storeId = 433
let param = args.widgetParameter
if (param != null && param.length > 0) {
    storeId = param
}

const widget = new ListWidget()
const storeInfo = await fetchStoreInformation()
const storeCapacityW550 = await fetchAmountOfW550()
const storeCapacityW1050 = await fetchAmountOfW1050()
const storeCapacityWeizenVK = await fetchAmountOfWeizenVK()
await createWidget()

// used for debugging if script runs inside the app
if (!config.runsInWidget) {
    await widget.presentSmall()
}
Script.setWidget(widget)
Script.complete()

// build the content of the widget
async function createWidget() {

    const logoImg = await getImage('dm-logo.png')

    widget.setPadding(8,8,8,8)
    const titleFontSize = 12
    const detailFontSize = 36

    let titelzeile = widget.addStack()
    titelzeile.layoutVertically()
    const titel = titelzeile.addText("meHl bei dm")
    titel.font = Font.boldSystemFont(14)
    widget.addSpacer(1)

    // weizen 550
    let row = widget.addStack()
    row.layoutHorizontally()

    let column = row.addStack()
    column.layoutVertically()

    const W550Text = column.addText("Weizenmehl 550: ")
    W550Text.font = Font.mediumRoundedSystemFont(11)

    const W550Count = row.addText(storeCapacityW550.toString())
    W550Count.font = Font.mediumRoundedSystemFont(11)
    if (storeCapacityW550 < 6) {
        W550Count.textColor = new Color("#E50000")
    } else {
        W550Count.textColor = new Color("#00CD66")
    }
    // widget.addSpacer(4)

    // weizen 1050
    let row2 = widget.addStack()
    row2.layoutHorizontally()

    let column2 = row2.addStack()
    column2.layoutVertically()

    const W1050Text = column2.addText("Weizenmehl 1050: ")
    W1050Text.font = Font.mediumRoundedSystemFont(11)

    const W1050Count = row2.addText(storeCapacityW1050.toString())
    W1050Count.font = Font.mediumRoundedSystemFont(11)
    if (storeCapacityW1050 < 6) {
        W1050Count.textColor = new Color("#E50000")
    } else {
        W1050Count.textColor = new Color("#00CD66")
    }
    // widget.addSpacer(4)

    // weizen vk
    let row3 = widget.addStack()
    row3.layoutHorizontally()

    let column3 = row3.addStack()
    column3.layoutVertically()

    const WeizenVKText = column3.addText("Weizen-Vollkorn: ")
    WeizenVKText.font = Font.mediumRoundedSystemFont(11)

    const WeizenVKCount = row3.addText(storeCapacityWeizenVK.toString())
    WeizenVKCount.font = Font.mediumRoundedSystemFont(11)
    if (storeCapacityWeizenVK < 6) {
        WeizenVKCount.textColor = new Color("#E50000")
    } else {
        WeizenVKCount.textColor = new Color("#00CD66")
    }
    // widget.addSpacer(4)
	
    // shop info & logo
    let infologo = widget.addStack()
    infologo.layoutHorizontally()

    let infos = infologo.addStack()
    infos.layoutVertically()

    const street = infos.addText(storeInfo.address.street)
    street.font = Font.regularSystemFont(8)

    const zipCity = infos.addText(storeInfo.address.zip + " " + storeInfo.address.city)
    zipCity.font = Font.regularSystemFont(8)

    let currentTime = new Date().toLocaleTimeString('de-DE', { hour: "numeric", minute: "numeric" })
    let currentDay = new Date().getDay()
    let isOpen
    if (currentDay > 0) {
        const todaysOpeningHour = storeInfo.openingHours[currentDay-1].timeRanges[0].opening
        const todaysClosingHour = storeInfo.openingHours[currentDay-1].timeRanges[0].closing
        const range = [todaysOpeningHour, todaysClosingHour];
        isOpen = isInRange(currentTime, range)
    } else {
        isOpen = false
    }

    let shopStateText
    if (isOpen) {
        shopStateText = infos.addText('Geöffnet')
        shopStateText.textColor = new Color("#00CD66")
    } else {
        shopStateText = infos.addText('Geschlossen')
        shopStateText.textColor = new Color("#E50000")
    }
    shopStateText.font = Font.mediumSystemFont(8)
    infologo.addSpacer(20)

    const logoImageStack = infologo.addStack()
    logoImageStack.layoutVertically()
    logoImageStack.addSpacer(0)
    const logoImageStack2 = logoImageStack.addStack()
    logoImageStack2.backgroundColor = new Color("#ffffff", 1.0)
    logoImageStack2.cornerRadius = 6
    const logo = logoImageStack2.addImage(logoImg)
    logo.imageSize = new Size(25, 25)
    logo.rightAlignImage()
    
}

// fetches the amount of weizen 550 packages
async function fetchAmountOfW550() {
    let url
    let counter = 0
        url = 'https://products.dm.de/store-availability/DE/availability?dans=459912&storeNumbers=' + storeId
        const req = new Request(url)
        const apiResult = await req.loadJSON()
        for (var i in apiResult.storeAvailabilities) {
            counter += apiResult.storeAvailabilities[i][0].stockLevel
        }
    return counter
}

// fetches the amount of weizen 1050 packages
async function fetchAmountOfW1050() {
    let url
    let counter = 0
        url = 'https://products.dm.de/store-availability/DE/availability?dans=468120&storeNumbers=' + storeId
        const req = new Request(url)
        const apiResult = await req.loadJSON()
        for (var i in apiResult.storeAvailabilities) {
            counter += apiResult.storeAvailabilities[i][0].stockLevel
        }
    return counter
}

// fetches the amount of weizen vollkorn packages
async function fetchAmountOfWeizenVK() {
    let url
    let counter = 0
        url = 'https://products.dm.de/store-availability/DE/availability?dans=468178&storeNumbers=' + storeId
        const req = new Request(url)
        const apiResult = await req.loadJSON()
        for (var i in apiResult.storeAvailabilities) {
            counter += apiResult.storeAvailabilities[i][0].stockLevel
        }
    return counter
}


// fetches information of the configured store, e.g. opening hours, address etc.
async function fetchStoreInformation() {
    let url
        url = 'https://store-data-service.services.dmtech.com/stores/item/de/' + storeId
        widget.url = 'https://www.dm.de/search?query=mehl&searchType=product'
    let req = new Request(url)
    let apiResult = await req.loadJSON()
    return apiResult
}

// checks whether the store is currently open or closed
function isInRange(value, range) {
    return value >= range[0] && value <= range[1];
}

// get images from local filestore or download them once
async function getImage(image) {
    let fm = FileManager.local()
    let dir = fm.documentsDirectory()
    let path = fm.joinPath(dir, image)
    if (fm.fileExists(path)) {
        return fm.readImage(path)
    } else {
        // download once
        let imageUrl
        switch (image) {
            case 'dm-logo.png':
                imageUrl = "https://i.imgur.com/sVvV1fq.png"
                break
            default:
                console.log(`Sorry, couldn't find ${image}.`);
        }
        let iconImage = await loadImage(imageUrl)
        fm.writeImage(path, iconImage)
        return iconImage
    }
}

// helper function to download an image from a given url
async function loadImage(imgUrl) {
    const req = new Request(imgUrl)
    return await req.loadImage()
}


// End of script
