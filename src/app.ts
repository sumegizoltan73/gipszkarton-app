import { ajax } from "rxjs/ajax";
import { forkJoin, map, switchMap, of } from "rxjs";
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

export type Album = {
  userId: number;
  id: number;
  title: string;
  photos?: Array<Photo>;
};

export type Photo = {
  id: number;
  title: string;
  url: string;
  thumbnailUrl: string;
};

function peldaFuggveny(bemenet: string | number): number {
  if (typeof bemenet == "string") {
    return bemenet.length;
  }
  return bemenet * 15;
}

const parts$ = ajax("./dist/parts.json?nocache=" + (new Date()).getTime()).pipe(
  map(response => (response.response as Part[]))
);

window.onload = async function () {
  parts$.subscribe(part => {
    console.log(part);
    render(part);
  });
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
      </div>
    ${parts.map(part => `
        <div class="row">
          <div class="col"><h3>${part.name}</h3></div>
          <div class="col"><p>${part.description}</p></div>
          <div class="col">${part.price} ${part.currency}</div>
          <div class="col">${part.price_m_m2} ${part.currency}</div>
        </div>
      `).join("")}
    </div>
  `;
}