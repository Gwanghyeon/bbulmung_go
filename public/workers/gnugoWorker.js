// gnugoWorker.js
self.exports = {};
self.importScripts('/engine/gnugo.js');

const params = new URLSearchParams(self.location.search);
const aiLevel = params.get('level') || '1';

let isReady = false;

// Emscripten Module configuration
self.Module = {
  arguments: ['--level', aiLevel], // URL 파라미터로 동적 난이도 설정
  onRuntimeInitialized: function() {
    isReady = true;
    self.postMessage({ type: 'ready' });
  },
  locateFile: function(path) {
    if (path.endsWith('.wasm')) {
      return '/engine/' + path;
    }
    return path;
  }
};

// Initialize the GNU Go module
self.exports.init(self.Module);

self.onmessage = function(e) {
  if (e.data.type === 'play') {
    if (!isReady) {
      self.postMessage({ type: 'error', error: 'GNU Go engine is not ready yet.' });
      return;
    }

    const { sgf, color } = e.data;
    const colorCode = color !== undefined ? color : 0; 
    
    try {
      const resultSgf = self.Module.ccall(
        "play", 
        "string", 
        ["number", "string"], 
        [colorCode, sgf]
      );
      
      self.postMessage({ type: 'move', sgf: resultSgf });
    } catch (err) {
      self.postMessage({ type: 'error', error: err.toString() });
    }
  } else if (e.data.type === 'score') {
    if (!isReady) {
      self.postMessage({ type: 'error', error: 'GNU Go engine is not ready yet.' });
      return;
    }

    const { sgf } = e.data;
    try {
      // Try to get score string from GNU Go
      const result = self.Module.ccall(
        "score", 
        "string", 
        ["string"], 
        [sgf]
      );
      self.postMessage({ type: 'score_result', result });
    } catch (err) {
      self.postMessage({ type: 'error', error: err.toString() });
    }
  }
};
