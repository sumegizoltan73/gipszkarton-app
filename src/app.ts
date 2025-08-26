import { ajax } from "rxjs/ajax";
import { forkJoin, map, switchMap, of } from "rxjs";
import "bootstrap";

export type CalcType = {
  id: string;
  definition: string;
  measure: string;
  unit: string;
};

export type JobPriceType = {
  key: string;
  applyForKey: string;
  applyForUserId: number;
  strategy: Array<"MinHours"|"TravelFee"|"BestPrice">;
  serviceRegion: Array<"city"|"county"|"country"|"unio"|"overseas">;
  serviceUnit: Array<"hour"|"day"|"m2"|"km"|"rate">;
  serviceUnitExt: Array<"minimum"|"max">;
  servicePlace: Array<"bottom"|"top"|"tower"|"towerTop">;
  serviceEstimation: Array<"perM2"|"perHour"|"perDay"|"inAHour"|"inADay">;
  serviceFieldType: Array<"measure"|"constant">;
  workfloow: Array<"Survey"|"Design"|"Travel"|"BusTravel"|"Sleep"|"Buy"|"Deliver"|"Eat"|"Planing"|"Move"|"Assemble"|"Screw"|"Glett"|"Painting">;
  excluded: string[];
  included: string[];
};
export interface JobPrice extends JobPriceType {
  minHours_m2?: number;
  minHours_hour?: number;
  bestPrice_bottom_rate_perHour_constant?: string;
  bestPrice_bottom_m2_perHour_constant?: number;
  bestPrice_bottom_m2_perDay_constant?: number;
};

export type PartDimension = {
  x: number;
  y: number;
  w: number;
};

export type Part = {
  key: string;
  name: string;
  description: string;
  dimension?: PartDimension;
  price: number;
  price_m_m2: number;
  price_m_m2_unit?: string;
  currency: string;
  jobPrice?: any[];
  calc?: CalcType[];
};

export type PriceListItem = {
  userid: number;
  formatVersion: string;
  url: string;
  token: string;
  jobPrices?: JobPrice[];
};

const parts$ = ajax("./dist/parts.json?nocache=" + (new Date()).getTime()).pipe(
  map(response => (response.response as Part[]))
);

const pricelist$ = ajax("./dist/pricelist.json?nocache=" + (new Date()).getTime()).pipe(
  map(response => (response.response as PriceListItem[])),
  switchMap(list => forkJoin([
    of(list),
    ...list.map(price => ajax(`${price?.url}?nocache=${(new Date()).getTime()}`).pipe(
      map(response => ((response.response as any)?.jobPrice as JobPrice[]))
    ))
  ])),
  map(([prices, ...allPrices]) => { 
    return <PriceListItem[]>prices.map((price, i) => ({...price, jobPrices: allPrices[i]}));
  })
);


let priceList: any = {};

window.onload = async function () {
  parts$.subscribe(part => {
    render(part);
    storePriceList(part);
  });
  pricelist$.subscribe(list => {
    storeUserPriceList(list);
  });
  renderPartHead();
  handleAddWall();
}

function storePriceList(parts: Array<Part>){
  parts.forEach(part => {
    priceList[part.key] = { 
      default: `${part.price} ${part.currency}` 
    };
  });
}

function storeUserPriceList(allPrices: PriceListItem[]){
  console.log("storeUserPr", allPrices);
  
  allPrices.forEach(jobprice => {
    jobprice.jobPrices?.forEach(price => {
      priceList[price.applyForKey] = {
        ...priceList[price.applyForKey], 
        [`user${price.applyForUserId}`]: { ...price } 
      };
    });
  });
  console.log("singleton", priceList);
}

function getFormatedPrice(price: string | undefined): [price: number, cur: string]{
  let formated: [price: number, cur: string] = [0, ""];

  if (typeof price === "undefined") {
    return formated;
  }

  const arr = price?.split(" ");
  if (arr.length === 2) {
    return [parseInt(<string>arr[0]), <string>arr[1] ]
  }
  return formated;
}

function getM2Price(price: JobPrice, m2: number): string {
  const rate = getFormatedPrice(price.bestPrice_bottom_rate_perHour_constant);
  const [tablePrice, tableCurrency] = rate;
  const m2PerHour = parseInt(`${price.bestPrice_bottom_m2_perHour_constant}`);
  const m2Price = tablePrice / m2PerHour;
  return `${m2Price * m2} ${tableCurrency}`;
}

function handleAddWall(){
  const container = document.getElementById("part-body-root");
  if (!container) {
    return;
  }
  const child = document.createElement("div");
  child.className = "row";
  child.innerHTML = `
    <div class="col">
      <div class="input-group mb-3">
        <input type="text" class="form-control dim-wall-x" placeholder="Szélesség (mm)" aria-label="Szélesség (mm)" />
        <span class="input-group-text"> X </span>
        <input type="text" class="form-control dim-wall-y" placeholder="Magasság (mm)" aria-label="Magasság (mm)" />
      </div>
    </div>
    <div class="col">
      <button type="button" class="btn btn-primary"><i class="bi bi-file-x"></i>Eltávolít</button>
    </div>
    `;
  container.appendChild(child);
  const btns = container.getElementsByTagName("BUTTON");
  for(const element of btns) {
    (<HTMLElement>element).onclick = handleRemoveWall;
  }
}

function handleRemoveWall(this: GlobalEventHandlers, ev: PointerEvent){
  const nodeToRemove = (<HTMLElement>this)?.parentNode?.parentNode;
  nodeToRemove?.parentNode?.removeChild(nodeToRemove);
}

function handleCalcWalls(){
  const xArray = document.getElementsByClassName("dim-wall-x");
  let sum = 0;
  for (const element of xArray) {
    const elX = (<HTMLElement>element);
    const elY = elX.nextSibling?.nextSibling?.nextSibling?.nextSibling;
    if (elY) {
      let sumPart = parseInt((<HTMLInputElement>elX).value) * parseInt((<HTMLInputElement>elY).value);
      sum += sumPart;
    }
  }
  const m2 = sum / (1000 * 1000);
  const tableCnt = Math.ceil(m2 / (2000 * 1200 / (1000 * 1000)));
  const fmCD = Math.ceil(m2) * ((2 * 1000 / 1000) + (1000 / 400));
  const CDCount = Math.ceil(fmCD / 3);;

  const container = document.getElementById("part-foot-root");
  if (!container) {
    return;
  }

  const tablePrice = parseInt(priceList["drywall"].default.split(" ")[0]);
  const tableCurrency = priceList["drywall"].default.split(" ")[1];
  const CDPrice = parseInt(priceList["CDProfile"].default.split(" ")[0]);
  const CDCurrency = priceList["CDProfile"].default.split(" ")[1];

  container.innerHTML = `
    <h3>Anyagszükséglet és munkadíj</h2>
    <div class="row mb-3">
      <div class="col">
        Gipszkarton (tábla): ${tableCnt} db azaz ${Math.ceil(m2)} m2 ${tablePrice * tableCnt} ${tableCurrency}<br />
        CD profil: ${CDCount} db azaz ${fmCD} méter ${CDPrice * CDCount} ${CDCurrency}<br />
      </div>
      <div class="col">
        <b>Munkadíj:</b> <br />
        ${Object.keys(priceList["drywall"]).filter((k) => priceList["drywall"][k].applyForUserId !== 0 && priceList["drywall"][k].applyForUserId !== undefined).map((el) => (`
          <p>${(<JobPrice>priceList["drywall"][el]).key} - UserId: ${(<JobPrice>priceList["drywall"][el]).applyForUserId}</p>
          <p>${getM2Price(<JobPrice>priceList["drywall"][el], Math.ceil(m2) )}</p>
          `)).join("")}
      </div>
    </div>
    <div class="row mb-3 bold text-primary">
      <div class="col">
        Összesen: ${(tablePrice * tableCnt) + (CDPrice * CDCount) } ${tableCurrency} + Munkadíj
      </div>
    </div>
    `;
}

function renderPartHead(){
  const container = document.getElementById("part-head-root");
  if (!container) {
    return;
  }
  container.innerHTML = `
    <h2>Válaszfal kalkulátor</h2>
    <div class="row mb-3">
      <div class="col">
        <button id="btnAddWall" type="button" class="btn btn-primary"><i class="bi bi-node-plus"></i>Új válaszfal</button>
      </div>
      <div class="col">
        <button id="btnCalcWalls" type="button" class="btn btn-primary"><i class="bi bi-check-lg"></i></i>Kiszámol</button>
      </div>
    </div>
    <div id="part-body-root">
    </div>
    <div id="part-foot-root">
    </div>
    `;
  const btnAdd = document.getElementById("btnAddWall");
  if (btnAdd) {
    btnAdd.onclick = handleAddWall;
  }
  const btnCalc = document.getElementById("btnCalcWalls");
  if (btnCalc) {
    btnCalc.onclick = handleCalcWalls;
  }
}

function render(parts: Array<Part>){
  const container = document.getElementById("root");
  if (!container) {
    return;
  }
  container.innerHTML = `
    <h2>Választható részek</h2>
    <div>
      <div class="row head">
        <div class="col">Termék</div>
        <div class="col">Leírás</div>
        <div class="col">db Ár</div>
        <div class="col">m2 Ár</div>
        <div class="col">Dimenzió</div>
      </div>
    ${parts.map(part => `
        <div class="row">
          <div class="col"><h3>${part.name}</h3></div>
          <div class="col"><p>${part.description}</p></div>
          <div class="col">${part.price} ${part.currency}</div>
          <div class="col">${part.price_m_m2} ${part.currency}</div>
          <div class="col">x:&nbsp;${part.dimension?.x}&nbsp;mm, y:&nbsp;${part.dimension?.y}&nbsp;mm, w:&nbsp;${part.dimension?.w}&nbsp;mm</div>
        </div>
      `).join("")}
    </div>
  `;
}