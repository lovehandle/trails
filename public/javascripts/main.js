var ONLINE_PATH  = 'http://{s}.tile.osm.org/{z}/{x}/{y}.png';
var OFFLINE_PATH = 'filesystem:http://local:3000/persistent/{z}_{x}_{y}.png';

jQuery('#download > a').on('click', downloadTiles)
jQuery('#online > a').on('click', toggleOnline);

function getTiles () {
  return jQuery('.leaflet-tile').map(function (index, element) {
    return [ jQuery(element).attr('src').match(/\d+/g) ];
  });
}

window.ONLINE = false;
window.MAP = L.map('map').setView([ 51.05, -0.09 ], 13);
toggleOnline();

function toggleOnline () {
  window.ONLINE = !window.ONLINE;
  window.TILE_URL = window.ONLINE ? ONLINE_PATH : OFFLINE_PATH;
  window.ONLINE ? window.MAP.dragging.enable() : window.MAP.dragging.disable();
  if (window.TILE_LAYER) window.MAP.removeLayer(window.TILE_LAYER)
  window.TILE_LAYER = L.tileLayer(window.TILE_URL, {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(window.MAP);
}

window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;
window.storageInfo = window.storageInfo || window.webkitStorageInfo;

var fileSystem = null,
    fsType = PERSISTENT,
    fsSize = 10 * 1024 * 1024;

window.storageInfo.requestQuota(fsType, fsSize, function(gb) {
  window.requestFileSystem(fsType, gb, function(fs) {
    fileSystem = fs;
  }, errorHandler);
}, errorHandler);

function downloadFile (url, success) {
  var xhr = new XMLHttpRequest(); 
  xhr.open('GET', url, true); 
  xhr.responseType = "blob";
  xhr.onreadystatechange = function () { 
    if (xhr.readyState == 4) {
      if (success) success(xhr.response);
    }
  };
  xhr.send(null);
}

function saveFile(data, path) {
  if (!fileSystem) return;

  fileSystem.root.getFile(path, {create: true}, function(fileEntry) {
    fileEntry.createWriter(function(writer) {
      writer.write(data);
    }, errorHandler);
  }, errorHandler);
}

function readFile(path, success) {
  fileSystem.root.getFile(path, {}, function(fileEntry) {
    fileEntry.file(function(file) {
      var reader = new FileReader();

      reader.onloadend = function(e) {
        if (success) success(this.result);
      };

      reader.readAsText(file);
    }, errorHandler);
  }, errorHandler);
}

function buildTileUrl (tile) {
  return 'http://c.tile.osm.org/'+tile.join('/')+'.png';

}

function buildTilePath (tile) {
  return tile.join('_') + '.png';
}

function downloadTiles () {
  var tiles = getTiles(); 
  jQuery(tiles).each(function (index, tile) {
    console.log('Downloading:' + tile);
    downloadFile(buildTileUrl(tile), function (blob) {
      saveFile(blob, buildTilePath(tile));
    })
  });
}

function errorHandler(e) {
  var msg = '';

  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      msg = 'QUOTA_EXCEEDED_ERR';
      break;
    case FileError.NOT_FOUND_ERR:
      msg = 'NOT_FOUND_ERR';
      break;
    case FileError.SECURITY_ERR:
      msg = 'SECURITY_ERR';
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      msg = 'INVALID_MODIFICATION_ERR';
      break;
    case FileError.INVALID_STATE_ERR:
      msg = 'INVALID_STATE_ERR';
      break;
    default:
      msg = 'Unknown Error';
      break;
  };

  console.log('Error: ' + msg);
}
