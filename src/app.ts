import { ajax } from "rxjs/ajax";
import { forkJoin, map, switchMap, of } from "rxjs";

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

type Metodus = "Fetch" | "RxJS";

const METODUS: Metodus = "RxJS"; 

let ertek = "teszt";
let ertek2 = Math.random();
let ertek3: Szamok = 42;

type Szamok = 1 | 42 | 3.2;
type Status = "Elkezdve" | "Folyamatban..." | "Befejezett";

let progress: Status;

progress = "Folyamatban...";

let szamok: number[] = [];

type Szemely = [name: string, age: number];

let szemely1: Szemely = ["Kovács J.", 42];
let szemely2: Szemely = ["Horváth D.", 42];

const [nev, eletkor] = szemely2;

function peldaFuggveny(bemenet: string | number): number {
  if (typeof bemenet == "string") {
    return bemenet.length;
  }
  return bemenet * 15;
}

console.log(peldaFuggveny("szia") *20);

async function getAlbums() {
  const fetchedAlbums = await fetch("http://jsonplaceholder.typicode.com/albums").then(response => {
    return response.json() as Promise<Album[]>;
  });

  const albums = fetchedAlbums.slice(0,5);

  const promisesOfAllPhotos = albums.map((album) => 
    fetch("http://jsonplaceholder.typicode.com/photos?albumId=" + album.id)
      .then(res => res.json() as Promise<Photo[]>));
  const allPhotos = await Promise.all(promisesOfAllPhotos);

  return albums.map((album, i) => ({...album, photos: allPhotos[i]}));
}

const albums$ = ajax("http://jsonplaceholder.typicode.com/albums").pipe(
  map(response => (response.response as Album[]).slice(0,5)),
  switchMap(albumok => forkJoin([
    of(albumok),
    ...albumok.map(album => ajax("http://jsonplaceholder.typicode.com/photos?albumId=" + album.id).pipe(
      map(response => <Photo[]>response.response)
    ))
  ])),
  map(([albumok, ...allPhotos]) => {
    return <Album[]>albumok.map((album, i) => ({...album, photos: allPhotos[i]}));
  })
);

window.onload = async function () {
  if (METODUS == "RxJS") {
    albums$.subscribe(adat => {
      console.log(adat);
      render(adat);
    });
  }
  else {
    const albums = await getAlbums() as Album[];
    render(albums);
  }
}

function render(albumok: Array<Album>){
  const container = document.getElementById("root");
  if (!container) {
    return;
  }
  container.innerHTML = `
    <h1>Albumok</h1>
    ${albumok.map(album => `
        <div>
          <h3>#${album.id}</h3>
          <p>${album.title}</p>
          <br />
          ${album.photos?.map(photo => `
              <img
                src="${photo.thumbnailUrl}"
                style="display:inline-block;margin-right: 6px;width:30px;height:30px;"
              />
            `).join("")}
        </div>
      `).join("")}
  `;
}