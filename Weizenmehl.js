
let country = 'de' 
let storeId = 433
let param = args.widgetParameter
if (param != null && param.length > 0) {
    storeId = param
}

const widget = new ListWidget()
const storeInfo = await fetchStoreInformation()
const storeCapacity = await fetchAmountOfPaper()
await createWidget()

// used for debugging if script runs inside the app
if (!config.runsInWidget) {
    await widget.presentSmall()
}
Script.setWidget(widget)
Script.complete()

// build the content of the widget
async function createWidget() {

    widget.addSpacer(4)
    const logoImg = await getImage('dm-logo.png')

    widget.setPadding(10, 10, 10, 10)
    const titleFontSize = 12
    const detailFontSize = 36

    const logoStack = widget.addStack()
    logoStack.addSpacer(86)
    const logoImageStack = logoStack.addStack()
    logoStack.layoutHorizontally()
    logoImageStack.backgroundColor = new Color("#ffffff", 1.0)
    logoImageStack.cornerRadius = 8
    const wimg = logoImageStack.addImage(logoImg)
    wimg.imageSize = new Size(40, 40)
    wimg.rightAlignImage()
    widget.addSpacer()

    const icon = await getImage('toilet-paper.png')
    let row = widget.addStack()
    row.layoutHorizontally()
    row.addSpacer(2)
    const iconImg = row.addImage(icon)
    iconImg.imageSize = new Size(40, 40)
    row.addSpacer(13)

    let column = row.addStack()
    column.layoutVertically()

    const paperText = column.addText("WEIZENMEHL")
    paperText.font = Font.mediumRoundedSystemFont(13)

    const packageCount = column.addText(storeCapacity.toString())
    packageCount.font = Font.mediumRoundedSystemFont(22)
    if (storeCapacity < 30) {
        packageCount.textColor = new Color("#E50000")
    } else {
        packageCount.textColor = new Color("#00CD66")
    }
    widget.addSpacer(4)

    const row2 = widget.addStack()
    row2.layoutVertically()

    const street = row2.addText(storeInfo.address.street)
    street.font = Font.regularSystemFont(11)

    const zipCity = row2.addText(storeInfo.address.zip + " " + storeInfo.address.city)
    zipCity.font = Font.regularSystemFont(11)

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
        shopStateText = row2.addText('Geöffnet')
        shopStateText.textColor = new Color("#00CD66")
    } else {
        shopStateText = row2.addText('Geschlossen schadeeee')
        shopStateText.textColor = new Color("#E50000")
    }
    shopStateText.font = Font.mediumSystemFont(11)
}

// fetches the amount of toilet paper packages
async function fetchAmountOfPaper() {
    let url
    let counter = 0
    if (country.toLowerCase() === 'at') {
        // Austria
        const array = ["156754", "180487", "194066", "188494", "194144", "273259", "170237", "232201", "170425", "283216", "205873", "205874", "249881", "184204"]
        for (var i = 0; i < array.length; i++) {
            let currentItem = array[i]
            url = 'https://products.dm.de/store-availability/AT/products/dans/' + currentItem + '/stocklevel?storeNumbers=' + storeId
            let req = new Request(url)
            let apiResult = await req.loadJSON()
            if (req.response.statusCode == 200) {
                counter += apiResult.storeAvailability[0].stockLevel
            }
        }
    } else {
        // Germany
        url = 'https://products.dm.de/store-availability/DE/availability?dans=595420,708997,137425,28171,485698,799358,863567,452740,610544,846857,709006,452753,879536,452744,485695,853483,594080,504606,593761,525943,842480,535981,127048,524535&storeNumbers=' + storeId
        const req = new Request(url)
        const apiResult = await req.loadJSON()
        for (var i in apiResult.storeAvailabilities) {
          if (apiResult.storeAvailabilities[i][0].stockLevel) {
              counter += apiResult.storeAvailabilities[i][0].stockLevel
          }
        }
    }
    return counter
}

// fetches information of the configured store, e.g. opening hours, address etc.
async function fetchStoreInformation() {
    let url
    if (country.toLowerCase() === 'at') {
        url = 'https://store-data-service.services.dmtech.com/stores/item/at/' + storeId
        widget.url = 'https://www.dm.at/search?query=toilettenpapier&searchType=product'
    } else {
        url = 'https://store-data-service.services.dmtech.com/stores/item/de/' + storeId
        widget.url = 'https://www.dm.de/search?query=weizenmehl&searchType=product'
    }
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
                imageUrl = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Dm_Logo.svg/300px-Dm_Logo.svg.png"
                break
            case 'toilet-paper.png':
                imageUrl = "https://i.imgur.com/Nra1754.png"
                break
            default:
                console.log(`Sorry, couldn't find ${image}.`);
        }
        let iconImage = await loadImage(imageUrl)
        fm.writeImage(path, iconImage)
        return iconImage
    }
}
