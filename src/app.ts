import { ajax } from "rxjs/ajax";
import { map } from "rxjs";
import "bootstrap";

export type PartDimension = {
  x: number;
  y: number;
  w: number;
};

export type Part = {
  name: string;
  description: string;
  dimension: PartDimension;
  price: number;
  price_m_m2: number;
  currency: string;
};

const parts$ = ajax("./dist/parts.json?nocache=" + (new Date()).getTime()).pipe(
  map(response => (response.response as Part[]))
);

let walls = 1;

window.onload = async function () {
  parts$.subscribe(part => {
    console.log(part);
    render(part);
  });
  renderPartHead();
  handleAddWall();
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
        <input type="text" class="form-control" placeholder="Szélesség (mm)" aria-label="Szélesség (mm)" />
        <span class="input-group-text"> X </span>
        <input type="text" class="form-control" placeholder="Magasság (mm)" aria-label="Magasság (mm)" />
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
  console.log("calculating");
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
          <div class="col">x:&nbsp;${part.dimension.x}&nbsp;mm, y:&nbsp;${part.dimension.y}&nbsp;mm, w:&nbsp;${part.dimension.w}&nbsp;mm</div>
        </div>
      `).join("")}
    </div>
  `;
}