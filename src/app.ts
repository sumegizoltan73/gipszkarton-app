import { ajax } from "rxjs/ajax";
import { map } from "rxjs";
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
};
const x: JobPrice = {
  key: "",
  applyForKey: "",
  applyForUserId: 0,
  workfloow: ["Survey", "Deliver", "Eat", "Planing", "Move", "Assemble", "Screw", "Glett", "Painting"],
  excluded: [],
  included: [],
  strategy: [],
  serviceRegion: [],
  serviceUnit: [],
  serviceUnitExt: [],
  servicePlace: [],
  serviceEstimation: [],
  serviceFieldType: []
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
};

const parts$ = ajax("./dist/parts.json?nocache=" + (new Date()).getTime()).pipe(
  map(response => (response.response as Part[]))
);

let priceList: any = {};

window.onload = async function () {
  parts$.subscribe(part => {
    render(part);
    storePriceList(part);
  });
  renderPartHead();
  handleAddWall();
}

function storePriceList(parts: Array<Part>){
  parts.forEach(part => {
    priceList[part.key] = `${part.price} ${part.currency}`;
  });
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

  const tablePrice = parseInt(priceList["drywall"].split(" ")[0]);
  const tableCurrency = priceList["drywall"].split(" ")[1];
  const CDPrice = parseInt(priceList["CDProfile"].split(" ")[0]);
  const CDCurrency = priceList["CDProfile"].split(" ")[1];
  const jobPrice = parseInt(priceList["JobPrice"].split(" ")[0]);
  const jobCurrency = priceList["JobPrice"].split(" ")[1];

  container.innerHTML = `
    <h3>Anyagszükséglet és munkadíj</h2>
    <div class="row mb-3">
      <div class="col">
        Gipszkarton (tábla): ${tableCnt} db ${tablePrice * tableCnt} ${tableCurrency}<br />
        CD profil: ${CDCount} db azaz ${fmCD} méter ${CDPrice * CDCount} ${CDCurrency}<br />
      </div>
      <div class="col">
        Munkadíj: ${jobPrice /12 * Math.ceil(m2)} ${jobCurrency}
      </div>
    </div>
    <div class="row mb-3 bold text-primary">
      <div class="col">
        Összesen: ${(tablePrice * tableCnt) + (CDPrice * CDCount) + (jobPrice /12 * Math.ceil(m2))} ${jobCurrency}
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