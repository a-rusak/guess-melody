import Application from '../application';
import AudioController from '../audio/audio';
import audioModel from '../audio/audio-model';
import {$on} from '../util';

const URL = `https://es.dump.academy/guess-melody`;
const NAME_ID = `rusak178490`;
const CHUNK_SIZE = 4;
let AUDIO_LOAD_TIMEOUT = 5000; // 5 sec initial timeframe to load one chunk

let timeout;
let notLoadedUrls = [];
let loadedChunkNumber = 0;

export default class Loader {
  static getLevels() {
    return fetch(`${URL}/questions`)
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else if (response.status === 404) {
            throw new Error(`Данные по адресу ${URL}/questions не найдены.`);
          }
          throw new Error(`Неизвестный статус: ${response.status} ${response.statusText}`);
        })
        .then((data) => {
          return data;
        });
  }

  static loadChunk(urls) {
    return Promise.all(
        urls.map(
            (url) => {
              return new Promise((resolve, reject) => {
                const audio = new AudioController(url);
                audioModel.setElement(url, audio.view.element);
                $on(`canplaythrough`, () => resolve(url), audio.view.audioElement);
                // const audio = new Audio();
                // audio.addEventListener(`canplaythrough`, () => resolve(url), false);
                // audio.src = url;
                timeout = setTimeout(() => reject(url), AUDIO_LOAD_TIMEOUT);
              });
            }
        )
    );
  }

  static loadBundle(bundles) {
    let chain = Promise.resolve();

    bundles.forEach((chunk) => {
      chain = chain
          .then((url) => {
            clearTimeout(timeout);
            // loadingNum--;
            // loadedNum++;
            console.log(`suc: `, url);
            loadedChunkNumber++;
            Application.updateProgress(loadedChunkNumber, bundles.length);
            return Loader.loadChunk(chunk);
          })
          .catch((url) => {
            // loadingNum--;
            notLoadedUrls.push(url);
            console.log(`catch: `, url);
          });
    });

    return chain;
  }

  static createBundle(urls) {
    return urls.reduce((acc, it, index) => {
      const bundleIndex = parseInt(index / CHUNK_SIZE, 10);
      if (typeof acc[bundleIndex] === `undefined`) {
        acc[bundleIndex] = [];
      }
      acc[bundleIndex][index % CHUNK_SIZE] = it;
      return acc;
    }, []);
  }

  static cacheAudio(urls, cb) {
    const bundle = Loader.createBundle(urls);
    console.log(bundle);
    Loader.loadBundle(bundle)
        .then(() => {
          if (notLoadedUrls.length > 0) {
            AUDIO_LOAD_TIMEOUT *= 2;
            Loader.cacheAudio(notLoadedUrls, cb);
            console.log(`${AUDIO_LOAD_TIMEOUT / 1000} sec`, notLoadedUrls);
            notLoadedUrls = [];
          } else {
            cb();
          }
        });
  }

  static getResults() {
    return fetch(`${URL}/stats/${NAME_ID}`)
        .then((response) => {
          if (response.ok) {
            return response.json();
          } else if (response.status === 404) {
            return [];
          }
          throw new Error(`Неизвестный статус: ${response.status} ${response.statusText}`);
        })
        .then((data) => {
          let stats = [];
          for (let it of data) {
            if (it.stats) {
              stats.push(it.stats);
            }
          }
          return stats;
        })
        .catch((error) => {
          throw new Error(error);
        });
  }

  static postResults(data) {
    const requestSettings = {
      body: JSON.stringify({
        time: +new Date(),
        stats: data
      }),
      headers: {
        'Content-Type': `application/json`
      },
      method: `POST`
    };
    return fetch(`${URL}/stats/${NAME_ID}`, requestSettings);
  }

}
