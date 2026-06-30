var _____WB$wombat$assign$function_____=function(name){return (globalThis._wb_wombat && globalThis._wb_wombat.local_init && globalThis._wb_wombat.local_init(name))||globalThis[name];};if(!globalThis.__WB_pmw){globalThis.__WB_pmw=function(obj){this.__WB_source=obj;return this;}}var window = _____WB$wombat$assign$function_____("window");
var self = _____WB$wombat$assign$function_____("self");
var document = _____WB$wombat$assign$function_____("document");
var location = _____WB$wombat$assign$function_____("location");
var top = _____WB$wombat$assign$function_____("top");
var parent = _____WB$wombat$assign$function_____("parent");
var frames = _____WB$wombat$assign$function_____("frames");
var opener = _____WB$wombat$assign$function_____("opener");
import 'https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js';
import 'https://d1zibq5kp019rb.cloudfront.net/node_modules/vue/vue.js';
// import 'https://cdn.jsdelivr.net/gh/alpinejs/alpine@v2.x.x/dist/alpine.min.js';

window.getHeaders = () => ({ 'Token': getCookie('Token'), 'SubAppId': getCookie('SubAppId'), 'Content-Type': 'application/json;charset=UTF-8', 'Accept': 'application/json' });
window.flatten = (arr) => { return arr.reduce((flat, toFlatten) => flat.concat(Array.isArray(toFlatten) ? window.flatten(toFlatten) : toFlatten), []); };
window.AsyncFunction = Object.getPrototypeOf(async () => { }).constructor;
window.deleteCookie = function (name) { setCookie(name, '', -1); };

window.getCookie = function (cname) {
  var name = cname + '=';
  var decodedCookie = decodeURIComponent(document.cookie);
  var ca = decodedCookie.split(';');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }

    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }

  return '';
};

window.setCookie = function (name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + 24 * 60 * 60 * 1000 * (days || 18250));
  document.cookie = name + "=" + value + ";path=/;expires=" + d.toGMTString();
};

window.postRequest = async function (url = '', data = {}, headers = { 'Content-Type': 'application/json;charset=UTF-8', 'Accept': 'application/json' }, cache = 'no-cache') {
  const response = await fetch(url, {
    method: 'POST',
    headers,
    cache,
    body: JSON.stringify(data || {}),
  });

  const contentType = response.headers.get('content-type');
  const responseData = await (contentType && contentType.includes('application/json') ? response.json() : response.text());
  if (!response.ok) {
    throw {
      message: response.statusText,
      response: {
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
      },
    };
  }

  return { data: responseData };
};

window.getRequest = async function (url = '', data = {}, headers = { 'Content-Type': 'application/json;charset=UTF-8', 'Accept': 'application/json' }) {
  const response = await fetch(url, {
    method: 'GET',
    headers
  });

  const contentType = response.headers.get('content-type');
  const responseData = await (contentType && contentType.includes('application/json') ? response.json() : response.text());
  if (!response.ok) {
    throw {
      message: response.statusText,
      response: {
        status: response.status,
        data: responseData,
        headers: Object.fromEntries(response.headers.entries()),
      },
    };
  }

  return { data: responseData };
};

window.debounce = function debounce(func, wait, immediate) {
  let timeout, args, context, timestamp, result;
  if (wait == null) wait = 100;

  function later() {
    const last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        context = args = null;
      }
    }
  };

  const debounced = function () {
    context = this;
    args = arguments;
    timestamp = Date.now();
    const callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };

  debounced.clear = function () {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  debounced.flush = function () {
    if (timeout) {
      result = func.apply(context, args);
      context = args = null;

      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
};

window.to = async function (promise) {
  return promise.then((data) => [null, data]).catch((err) => [err, null]);
};

class MarsBase {
  constructor(id, serverData) {
    this._marsId = id;
    this._marsEl = document.getElementById(id);
    this._marsData = serverData;

    this.initApi();
    this.initEvents();

    window[this._marsId] = this;
  }

  initApi() {
    this.api = {
      _hidden: false,
      hide: () => { this._marsEl.classList.add('d-none') },
      show: () => { this._marsEl.classList.remove('d-none') },
      get hidden() { return this._hidden; },
      set hidden(val) {
        val ? this.hide() : this.show();
        this._hidden = val;
      },
    };

    const defaultMethods = [{ name: 'reRender', block: 'MarsJs' }];
    if (!this._marsData) { this._marsData = {}; }
    if (!this._marsData.methods) { this._marsData.methods = []; }

    [...this._marsData.methods, ...defaultMethods].forEach(i => {
      this.api[i.name] = (...args) => {
        return new Promise((resolve, reject) => {
          window.postRequest(`/api/ExecuteApiMethod?blockName=${i.block}&methodName=${i.name}`, { "blockData": this._marsData, "methodData": args }, window.getHeaders())
            .then((response) => {
              resolve(response.data);
            })
            .catch((error) => {
              reject(error);
            });
        });
      }
    });

    this.api.reload = async (optionalData) => {
      const r = await this.api.reRender(this._marsData._blockName, { Id: this._marsId, ...this._marsData, ...(optionalData || {}) });

      // remove all children objects
      delete window[this._marsId];
      let children = document.querySelectorAll(`#${this._marsId} [id]`);
      children.forEach(i => {
        if (window[i.id]) {
          delete window[i.id];
        }
      });

      $(`#${this._marsId}`).replaceWith(r);
      return r;
    }
  }

  initEvents() {
    this._marsEvents = {
      initEvent: (eventName) => {
        if (!this[eventName]) {
          const eventHandlersKey = `${eventName}_Handlers`;
          this._marsEvents[eventHandlersKey] = [];
          Object.defineProperty(this, eventName, {
            set: (handler) => {
              if (!this._marsEvents[eventHandlersKey].find(t => t.toString() === handler.toString())) {
                this._marsEvents[eventHandlersKey].push(handler);
              }
            },
            // get: () => {
            //   return this._marsEvents[eventHandlersKey];
            // },
          });
        }
      },
      fireEvent: (eventName, ...eventData) => {
        const eventHandlersKey = `${eventName}_Handlers`;
        if (this._marsEvents[eventHandlersKey] && this._marsEvents[eventHandlersKey].length) {
          this._marsEvents[eventHandlersKey].forEach(t => t(...eventData));
        }
      },
    };

    this.fire = {};
    if (this._marsData.events) {
      for (let eventName in this._marsData.events) {
        this._marsEvents.initEvent(eventName);
        this.fire[eventName] = (...eventData) => {
          this._marsEvents.fireEvent(eventName, ...eventData);
        };
      }
    }
  }
}

class MarsBlock extends MarsBase {
  constructor(id, serverData, app) {
    super(id, { ...serverData, events: app.events });

    Object.getOwnPropertyNames(app).map(property => {
      const propertyDescriptor = Object.getOwnPropertyDescriptor(app, property);
      Object.defineProperty(this, property, propertyDescriptor);
    });

    window.dispatchEvent(new CustomEvent(id, { detail: this }));
  }
}

class MarsVue extends MarsBase {
  constructor(id, serverData, app) {
    if (!id) {
      return;
    }

    super(id, { ...serverData, events: app.events });
    const vue = new Vue(Object.assign(app, { el: `#${id}` }));

    Object.getOwnPropertyNames(this).map(property => {
      const propertyDescriptor = Object.getOwnPropertyDescriptor(this, property);
      Object.defineProperty(vue, property, propertyDescriptor);
    });

    window[id] = vue;
    this.vue = vue;
    window.dispatchEvent(new CustomEvent(id, { detail: vue }));
  }
}

/*
class MarsAlpine extends MarsBase {
  init() {
    return this._marsData;
  }

  get data() {
    return this._marsData.$el.__x.$data;
  }

  constructor(instanceId, serverData, app) {
    if (!instanceId) {
      return;
    }

    super(instanceId, { ...serverData, ...app });
    this._marsData.fire = this.fire;

    const el = document.getElementById(instanceId);
    el.setAttribute('x-data', instanceId + '.init()');
    Alpine.initializeComponent(el);
  }
}
*/

window['MarsBlock'] = MarsBlock;
window['MarsVue'] = MarsVue;
// window['MarsAlpine'] = MarsAlpine;

const awaitForBlock = async function (blockId) {
  const isMarsObject = (block) => (block && block.constructor && (block instanceof Vue || block instanceof MarsBlock || block.constructor.name === 'MarsBlock'));
  return new Promise((resolve, reject) => {
    const block = window[blockId];
    if (isMarsObject(block)) {
      resolve(block);
      return;
    }

    window.addEventListener(blockId, (e) => {
      if (isMarsObject(e.detail)) {
        resolve(e.detail);
      }
    });
  });
};

const awaitForDomNode = async function (selector) {
  return new Promise((resolve, reject) => {
    const node = document.querySelector(selector);
    if (node) {
      resolve(node);
      return;
    }

    new MutationObserver((mutationRecords, observer) => {
      const node = document.querySelector(selector);
      if (node) {
        resolve(node);
        observer.disconnect();
        return;
      }
    }).observe(document.documentElement, { childList: true, subtree: true });
  });
};

window.executeAppBlock = async function executeAppBlock(f, props, ...children) {
  // regular html tags
  if (typeof (f) === 'string') {
    const htmlProps = props ? Object.entries(props).map(([key, value]) => `${key}="${value}"`).join(' ') : null;
    return `<${f} ${htmlProps || ''}>${(await Promise.all(flatten(children))).join('')}</${f}>`
  }

  // function block
  if (children && children.length > 0) {
    props = props || {};
    props.children = await Promise.all(flatten(children));
    /*props.children = await Promise.all(props.children.map(t => {
        const r = t.render ? t.render() : t;
        return r;
    }));*/
  }

  return f.name === 'anonymous' ? f(Mars, props) : f(props);
};


function editData(name, objectId, path, options = {}) {
  const editUrl = `/mars/edit-data/${name}/blocks?objectId=${objectId || ''}&path=${path || 'Config'}`;
  console.log('editUrl', editUrl)
  Modal.open(`/api/RenderFormByModel?Id=RenderDataByModel1&modelName=${name}&path=${path || 'Config'}&collectionName=blocks&objectId=${objectId || ''}&iframeUrl=${encodeURIComponent(editUrl)}`,
    { ...{ width: '550px', noPadding: true, title: `Edit ${name}` }, ...options })
}

function editDataModel(name, objectId, options = {}) {
  const editUrl = `/mars/edit-data-args/${name}`;
  console.log('editUrl', editUrl)
  Modal.open(`/api/RenderFormByModel?height=900px&Id=RenderDataByModel1&modelName=${name}&path=DataArgs&collectionName=blocks&objectId=${objectId || ''}&iframeUrl=${encodeURIComponent(editUrl)}`,
    { ...{ width: '800px', height: '100%', noPadding: true, title: `Edit model: ${name}` }, ...options })
}

window.Mars = {
  executeAppBlock,
  editData,
  editDataModel,
  awaitForBlock,
  awaitForDomNode,
};

// to create removeEventListeners - https://stackoverflow.com/a/47117084
(function () {
  const target = EventTarget.prototype;
  const functionName = 'addEventListener';
  const func = target[functionName];

  const symbolHidden = Symbol('hidden');

  function hidden(instance) {
    if (instance[symbolHidden] === undefined) {
      const area = {};
      instance[symbolHidden] = area;
      return area;
    }

    return instance[symbolHidden];
  }

  function listenersFrom(instance) {
    const area = hidden(instance);
    if (!area.listeners) { area.listeners = []; }
    return area.listeners;
  }

  target[functionName] = function (type, listener) {
    if (!this) {
      return;
    }

    const listeners = listenersFrom(this);
    listeners.push({ type, listener });
    func.apply(this, [type, listener]);
  };

  target['removeEventListeners'] = function (targetType) {
    if (!this) {
      return;
    }

    const self = this;
    const listeners = listenersFrom(this);
    listeners.forEach(item => {
      const type = item.type;
      const listener = item.listener;
      if (type == targetType) {
        self.removeEventListener(type, listener);
      }
    });
  };
})();

// to observe window.location.href changes
let currentHref = document.location.href;
window.onload = function () {
  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (currentHref != document.location.href) {
        currentHref = document.location.href;
        window.dispatchEvent(new Event('onLocationChange'));
      }
    });
  });

  const body = document.querySelector('body');
  observer.observe(body, { childList: true, subtree: true });
};
window.resizeIFrameToFitContent = (iFrame) => {
  const height = iFrame.contentWindow.document.body.scrollHeight;
  iFrame.width = iFrame.contentWindow.document.body.scrollWidth;
  iFrame.height = height > 550 ? height : 550;
}

window.scrollToAnchor = (topOffset) => {
  if (location.hash && location.hash.length > 1) {
    $('html, body').animate({
      scrollTop: $('h1,h2,h3,h4,h5,h6').filter(':contains("' + decodeURIComponent(location.hash.slice(1)) + '")').scroll().offset().top + (topOffset || 0)
    })
  }
}

window.marsAlert = (message, status) => {
  Modal.open('/api/MessageTemplate', { center: true, hideModalHeader: true, width: '350px', noPadding: true, hideCloseButton: true }, null, { message, status })
}
/* load new page content when user clicks on an element with data-target-partial tag and prevent default navigation */
$(document).on('click', '[data-target-partial]', function (e) {
  e.preventDefault();
  const targetUrl = $(this).attr('href');
  targetUrl.startsWith('http') || targetUrl.startsWith('www.')
    ? window.open(targetUrl)
    : window.goTo(targetUrl);

  return false;
});

window.history.replaceState(location.pathname, '', location.href);

window.onpopstate = function (e) {
  if (e.state != null) {
    if (typeof (e.state) === 'string') window.goTo(e.state, true, null, true)
    else window.goTo(e.state.targetUrl, true, e.state, true);
  }
}

window.goTo = async (targetUrl, dontScroll, cachedData, goBack = false) => {
  if (!targetUrl) targetUrl = location.href;
  if (!goBack) { window.history.pushState(targetUrl, '', targetUrl); }
  history.replaceState(targetUrl, null, targetUrl);
  pageLoadSpinner.hidden = false;

  function replaceHtmlOnPage(t) {
    const namedSlot = $(`#${t.data.master}`);
    const slot = $(`[data-master-content]:first`);

    // if the target page master is nested, then we reload the page since we cannot do ajax in this case
    if (!$(`[data-master-content]`).toArray().map(t => t.id).includes(t.data.master)) {
      location.reload();
      return;
    }

    // if it is first level navigation we scroll to the top
    if ($(`[data-master-content]`).length === 1 && !dontScroll) {
      // console.log('scroll to top')
      window.scrollTo(0, 0);
    }

    (namedSlot.length > 0 ? namedSlot : slot).html(typeof (t.data) === 'string' ? t.data : t.data.html);
    pageLoadSpinner.hidden = true;

    document.title = t.data.pageTitle;
    // google analytics page view tracking
    if (window.webMesurementId && gtag) {
      window.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: location.href,
        page_path: location.pathname,
        send_to: window.webMesurementId,
      });
    }

    scrollToAnchor();
    //history.pushState({ data: t.data, targetUrl: targetUrl }, null, targetUrl);
  }

  if (cachedData) {
    replaceHtmlOnPage(cachedData);
  } else {
    return window.getRequest(targetUrl + (targetUrl.includes('?') ? '&' : '?') + 'noMaster=true').then(replaceHtmlOnPage).catch(function (reason) { console.error(reason); return reason; });
  }
}
/*
     FILE ARCHIVED ON 12:42:58 Sep 22, 2021 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 23:27:37 Jun 29, 2026.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/*
playback timings (ms):
  captures_list: 0.82
  exclusion.robots: 0.079
  exclusion.robots.policy: 0.064
  esindex: 0.014
  cdx.remote: 20.317
  LoadShardBlock: 716.075 (3)
  PetaboxLoader3.resolve: 114.084 (4)
  PetaboxLoader3.datanode: 170.293 (5)
  load_resource: 129.826
  loaddict: 61.907
*/