import Nifty from './nifty.js';

export default (socket) => {
  return class NiftySocket extends Nifty {
    emit(action, payload) {
      if (payload !== null) {
        socket.emit(action, payload);
      }
    }

    on(action) {
      socket.on(action, this._onResponse);
    }

    off(action) {
      socket.off(action, this._onResponse);
    }
  };
};
