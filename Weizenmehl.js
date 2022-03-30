let country = "de"; // replace with 'at' for shops in Austria
let storeId = 433;
let param = args.widgetParameter;
if (param != null && param.length > 0) {
  if (param.indexOf(";") > 0) {
    const paramSplit = param.split(";");
    storeId = paramSplit[0];
    country = paramSplit[1].toLowerCase();
  } else {
    storeId = param;
  }
}

const widget = new ListWidget();
const storeInfo = await fetchStoreInformation();
const storeCapacity = await fetchAmountOfPaper();
const isOnlineAvailable = await isAvailableOnline();
await createWidget();

// used for debugging if script runs inside the app
if (!config.runsInWidget) {
  await widget.presentSmall();
}
Script.setWidget(widget);
Script.complete();

// build the content of the widget
async function createWidget() {
  const logoImg = await getImage("dm-logo.png");

  widget.setPadding(6, 10, 8, 10);
  const titleFontSize = 12;
  const detailFontSize = 36;

  const logoStack = widget.addStack();
  logoStack.addSpacer();
  const logoImageStack = logoStack.addStack();
  logoStack.layoutHorizontally();
  logoImageStack.backgroundColor = new Color("#ffffff", 1.0);
  logoImageStack.cornerRadius = 8;
  const wimg = logoImageStack.addImage(logoImg);
  wimg.imageSize = new Size(32, 32);
  wimg.rightAlignImage();

  const paperText = widget.addText("WEIZENMEHL");
  paperText.font = Font.semiboldRoundedSystemFont(11);

  widget.addSpacer(8);

  const icon = await getImage("covidtest.png");
  let row = widget.addStack();
  row.layoutHorizontally();
  row.addSpacer(2);
  const iconImg = row.addImage(icon);
  iconImg.imageSize = new Size(32, 32);
  row.addSpacer(12);

  let column = row.addStack();
  column.layoutVertically();

  const storeText = column.addText("STORE");
  storeText.textOpacity = 0.8;
  storeText.font = Font.mediumRoundedSystemFont(10);
  const packageCount = column.addText(storeCapacity.toString());
  if (storeCapacity > 999) {
    packageCount.font = Font.mediumRoundedSystemFont(16);
  } else {
    packageCount.font = Font.mediumRoundedSystemFont(19);
  }
  //   packageCount.minimumScaleFactor = 0.8
  if (storeCapacity < 5) {
    packageCount.textColor = new Color("#E50000");
  } else {
    packageCount.textColor = new Color("#00CD66");
  }

  row.addSpacer(12);

  let column2 = row.addStack();
  column2.layoutVertically();
  const onlineText = column2.addText("ONLINE");
  onlineText.textOpacity = 0.8;
  onlineText.font = Font.mediumRoundedSystemFont(10);
  column2.addSpacer(3);

  let onlineAvailableIcon;
  if (isOnlineAvailable) {
    onlineAvailableIcon = "✅";
  } else {
    onlineAvailableIcon = "⛔️";
  }
  const onlineAvailableText = column2.addText(onlineAvailableIcon);

  if (storeCapacity > 999) {
    onlineAvailableText.font = Font.regularSystemFont(11);
  } else {
    onlineAvailableText.font = Font.regularSystemFont(13);
  }

  widget.addSpacer(10);

  const row2 = widget.addStack();
  row2.layoutVertically();

  const street = row2.addText(storeInfo.address.street);
  street.font = Font.regularSystemFont(11);
  street.minimumScaleFactor = 0.8;
  street.lineLimit = 2;

  const zipCity = row2.addText(
    storeInfo.address.zip + " " + storeInfo.address.city
  );
  zipCity.font = Font.regularSystemFont(11);
  zipCity.minimumScaleFactor = 0.8;
  zipCity.lineLimit = 1;

  let currentTime = new Date().toLocaleTimeString("de-DE", {
    hour: "numeric",
    minute: "numeric",
  });
  let currentDay = new Date().getDay();
  let isOpen;
  if (currentDay > 0) {
    const todaysOpeningHour =
      storeInfo.openingHours[currentDay - 1].timeRanges[0].opening;
    const todaysClosingHour =
      storeInfo.openingHours[currentDay - 1].timeRanges[0].closing;
    const range = [todaysOpeningHour, todaysClosingHour];
    isOpen = isInRange(currentTime, range);
  } else {
    isOpen = false;
  }

  let shopStateText;
  if (isOpen) {
    shopStateText = row2.addText("GEÖFFNET");
    shopStateText.textColor = new Color("#00CD66");
  } else {
    shopStateText = row2.addText("GESCHLOSSEN");
    shopStateText.textColor = new Color("#E50000");
  }
  shopStateText.font = Font.semiboldSystemFont(10);
}

// fetches the amount of milk packages
async function fetchAmountOfPaper() {
  let url;
  let counter = 0;
  if (country.toLowerCase() === "at") {
    // Austria
    const array = ["188896","114408"];
    for (var i = 0; i < array.length; i++) {
      let currentItem = array[i];
      url =
        "https://products.dm.de/store-availability/AT/products/dans/" +
        currentItem +
        "/stocklevel?storeNumbers=" +
        storeId;
      let req = new Request(url);
      let apiResult = await req.loadJSON();
      if (req.response.statusCode == 200) {
        counter += apiResult.storeAvailability[0].stockLevel;
      }
    }
  } else {
    // Germany
    url = "https://products.dm.de/store-availability/DE/availability?dans=798989,819862,797046,800021&storeNumbers=" + storeId;
    const req = new Request(url);
    const apiResult = await req.loadJSON();
    for (var i in apiResult.storeAvailabilities) {
      if (apiResult.storeAvailabilities[i][0].stockLevel) {
        counter += apiResult.storeAvailabilities[i][0].stockLevel;
      }
    }
  }
  return counter;
}

async function isAvailableOnline() {
  let url;
  if (country.toLowerCase() === "at") {
    url =
      "https://products.dm.de/product/at/search?productQuery=%3Arelevance%3Adan%3A188896";
  } else {
    url =
      "https://products.dm.de/product/de/search?productQuery=%3Arelevance%3Adan%3A796724&purchasableOnly=false&hideFacets=false&hideSorts=false&pageSize=30";
  }
  let req = new Request(url);
  let apiResult = await req.loadJSON();

  if (req.response.statusCode == 200) {
    for (var i = 0; i < apiResult.products.length; i++) {
      if (apiResult.products[i].purchasable) {
        return true;
      }
    }
  }
  return false;
}

// fetches information of the configured store, e.g. opening hours, address etc.
async function fetchStoreInformation() {
  let url;
  if (country.toLowerCase() === "at") {
    url =
      "https://store-data-service.services.dmtech.com/stores/item/at/" +
      storeId;
    widget.url =
      "https://www.dm.at/keine-marke-coronavirus-antigen-schnelltest-fuer-zuhause-p2099999042083.html";
  } else {
    url =
      "https://store-data-service.services.dmtech.com/stores/item/de/" +
      storeId;
    widget.url =
      "https://www.dm.de/search?query=weizenmehl&searchType=product";
  }
  let req = new Request(url);
  let apiResult = await req.loadJSON();
  return apiResult;
}

// checks whether the store is currently open or closed
function isInRange(value, range) {
  return value >= range[0] && value <= range[1];
}

// get images from local filestore or download them once
async function getImage(image) {
  let fm = FileManager.local();
  let dir = fm.documentsDirectory();
  let path = fm.joinPath(dir, image);
  if (fm.fileExists(path)) {
    return fm.readImage(path);
  } else {
    // download once
    let imageUrl;
    switch (image) {
      case "dm-logo.png":
        imageUrl =
          "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Dm_Logo.svg/300px-Dm_Logo.svg.png";
        break;
      case "covidtest.png":
        imageUrl = "https://i.imgur.com/Nra1754.png";
        break;
      default:
        console.log(`Sorry, couldn't find ${image}.`);
    }
    let iconImage = await loadImage(imageUrl);
    fm.writeImage(path, iconImage);
    return iconImage;
  }
}

// helper function to download an image from a given url
async function loadImage(imgUrl) {
  const req = new Request(imgUrl);
  return await req.loadImage();
}





//
// make sure to copy everything!
//
