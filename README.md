![jsinspector](http://switer.github.io/live/images/jsinspector.png)
===================================================================
Synchronize DOMContent, Console(logs) and Errors from remote browser.
It makes a web projection. You can use for remote demonstration or debugging mobile web app.

## Get Started

* Visit __jsinspector__ [home page](http://jsinspector.com/)
* Inject the __script__ which from home page to your webapp's html
* After running your website that has injected the jsinspector script, 
  open __inspector window__ (which has a button-link on home page), your can see the inspected page on __inspector window__

## Local Server

#### Installing
```bash
git clone https://github.com/switer/jsinspector.git jsinspector
```

#### Startg Server
JSInspector server require [node.js](http://nodejs.org). After install node , running server with [npm](http://npmjs.org) (node.js package manager).
```bash
cd ./jsinspector
npm i
npm start
```

#### Visit home Page and inject inspector Script
Inject the __script__ (which has an inspector id) from __home page__ to remote website, then visit __inspector__ (your can get then link on home page):
```bash
## home page
https://yourhost:port/
## inspector page
https://yourhost:port/devtools?xxx-xxx
```

## Features

#### Inject codes to client
use `inject` api , so you can inject the code from devtools `console` to client side.
Tap the code in `devtools` website's `console` panel:
```js

// inject()
inject('console.log("window")') // will get window object form client side
inject('console.log("%s","%s")', 'document', 'window') // also support placeholder

// inject() block codes 
inject(function () {
    console.log(document) // will get document object form client side
    console.log(window) // will get window object form client side
})

// inject.js()
inject.js('http://yourhost/lib.js') // will inject that script resource to client side

// inject.css()
inject.css('http://yourhost/style.css') // will inject that stylesheet resource to client side
```
#### HTML sync
This is the primary feature, all the html of client will be synchroized to remote server and can be view on
__inspector__ window(eg. http://yourhost/devtools?xxxx-xxxxx).

#### Console sync
support console: `log`, `clear`, `error`, `info`, `warn`, `time` and `timeEnd`, these console api will be synchroized and show in inspector's `devtool-console panel`.
It support every object to console.log, such as:
```javascript
// global object
console.log(window); // -> {xxx: 'String', xxx2: 'Function', ..., window: 'Global'} 
// document object
console.log(document); // -> {xxx: 'String', xxx2: 'Function', ..., body: 'HTMLBodyElement'}
// null
console.log(null); // -> null
// undefined will be a undefined string
console.log(undefined); // -> 'undefined'
// NaN will be a NaN string
console.log(NaN); // -> 'NaN'
// No-JSON object : function will be function code string
console.log({name: function () {console.log('xxxx');}}); // -> { name: "function () {console.log('xxxx');}" }
// No-JSON object : Element Node will be tagHTML(outerHTML.replace(innerHTML, ''))
console.log([1, 2, document.body]); // -> [1, 2, "<body></body>"]
// No-JSON object : Text Node will be textContent
console.log(document.body.childNodes[0]); // -> "\r\nxxxx"
```

#### Exceptions sync
use `window.onerror`(window.addEventListener('error')) to catch global exceptions. Those error will be synchroized in 
inspector's `devtool-console panel`. use output format: `console.error(error, src + lineNumber)`



## License

The MIT License (MIT)

Copyright (c) 2014 guankaishe

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
