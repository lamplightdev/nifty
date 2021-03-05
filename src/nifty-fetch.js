import Nifty from './nifty.js';

class NiftyFetch extends Nifty {
  constructor() {
    super();

    this._onFetchResponse = this._onFetchResponse.bind(this);
  }

  _onFetchResponse(event) {
    this._onResponse(event.detail);
  }

  async emit(action, payload, method) {
    if (payload !== null) {
      const opts = {
        method,
        headers: {
          'Content-Type': 'application/json; charset=UTF-8',
        },
      };

      if (payload !== undefined) {
        opts.body = JSON.stringify(payload);
      }

      const response = await fetch(action, opts);

      const text = await response.text();

      this.dispatchEvent(
        new CustomEvent(action, {
          bubbles: true,
          composed: true,
          detail: text,
        })
      );
    }
  }

  on(action) {
    this.addEventListener(action, this._onFetchResponse);
  }

  off(action) {
    this.removeEventListener(action, this._onFetchResponse);
  }
}

export default NiftyFetch;
