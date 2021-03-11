class Nifty extends HTMLElement {
  constructor() {
    super();

    if (!this.shadowRoot) {
      const template = this.querySelector('template');
      if (template) {
        const mode = template.getAttribute('shadowroot') || 'open';
        const shadowRoot = this.attachShadow({ mode });
        shadowRoot.appendChild(template.content);
        template.remove();
      }
    }

    this._forms = [];
    this._actions = [];
    this._defaultTargetRoot = 'shadow';

    this._onSubmit = this._onSubmit.bind(this);
    this._onResponse = this._onResponse.bind(this);
  }

  connectedCallback() {
    this._defaultTargetRoot =
      this.getAttribute('root') || this._defaultTargetRoot;

    const actions = this.getAttribute('nifty-actions');
    this._actions = actions ? actions.split('|') : [];

    for (let action of this._actions) {
      this.on(action);
    }

    this._forms = [...this.querySelectorAll('form[nifty-action]')]
      .filter((form) => form.closest('[nifty]') === this)
      .concat(
        this.shadowRoot
          ? [...this.shadowRoot.querySelectorAll('form[nifty-action]')].filter(
              (form) => !form.closest('[nifty]')
            )
          : []
      );

    for (let form of this._forms) {
      form.addEventListener('submit', this._onSubmit);
    }
  }

  disconnectedCallback() {
    for (let action of this._actions) {
      this.off(action);
    }

    for (let form of this._forms) {
      form.removeEventListener('submit', this._onSubmit);
    }
  }

  _onSubmit(event) {
    const form = event.target;

    event.preventDefault();

    const action = form.getAttribute('nifty-action');
    const payload = form.hasAttribute('nifty-payload')
      ? form.getAttribute('nifty-payload')
      : undefined;
    const method =
      form.getAttribute('nifty-method') || form.getAttribute('method');

    this.emit(action, payload && this[payload](form), method);
  }

  _onResponse(payload) {
    const template = document.createElement('template');
    template.innerHTML = payload.trim();
    const niftyResponses = template.content.querySelectorAll('nifty-response');

    for (let niftyResponse of niftyResponses) {
      const opts = {};
      for (let optName of ['action', 'target', 'root', 'callback', 'type']) {
        opts[optName] = niftyResponse.getAttribute(optName);
      }

      const content =
        opts.type === 'json'
          ? JSON.parse(
              niftyResponse.querySelector('template').content.textContent.trim()
            )
          : niftyResponse.querySelector('template');

      const targets = this._getTargetEls(opts);

      this[`_${opts.action}`] &&
        this[`_${opts.action}`](targets, content, opts);

      if (opts.callback) {
        for (let callback of opts.callback.split('|')) {
          this[callback] && this[callback](targets, content, opts);
        }
      }
    }
  }

  _getTargetEls(opts) {
    if (opts.target) {
      if (opts.target === 'self') return [this];

      switch (opts.root || this._defaultTargetRoot) {
        case 'self':
          return this.querySelectorAll(opts.target);
        case 'document':
          return document.querySelectorAll(opts.target);
        case 'shadow':
        default:
          return this.shadowRoot.querySelectorAll(opts.target);
      }
    }

    return [];
  }

  _append(targets, content, opts, action = 'append') {
    for (let target of targets) {
      target[action](content.cloneNode(true).content);
    }
  }

  _prepend(targets, content, opts) {
    this._append(targets, content, opts, 'prepend');
  }

  _remove(targets) {
    for (let target of targets) {
      target.remove();
    }
  }

  _replace(targets, content, opts) {
    for (let target of targets) {
      target.replaceWith(content.cloneNode(true).content);
    }
  }

  _update(targets, content) {
    for (let target of targets) {
      target.innerHTML = '';
      target.append(content.cloneNode(true).content);
    }
  }

  _updateAttributes(targets, attrs, opts) {
    for (let target of targets) {
      for (let name of Object.keys(attrs)) {
        if (attrs[name] === true) {
          target.setAttribute(name, '');
        } else if (attrs[name] === false) {
          target.removeAttribute(name);
        } else {
          target.setAttribute(name, attrs[name]);
        }
      }
    }
  }
}

export default Nifty;
