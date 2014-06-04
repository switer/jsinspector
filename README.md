![jsinspector](http://switer.github.io/live/images/jsinspector.png)
===================================================================
Synchronize DOMContent, Console(logs) and Errors from remote browser.
It makes a web projection. You can use for remote demonstration or debugging mobile web app.

## Usage

* Visit __jsinspector__ [home page](http://jsinspector.com/)
* InJector the __script__ which form home page to your app's html
* After running your website that has injected the jsinspector script, 
  open __inspector__ (which has a button-link on home page), your can see the inspected page on __inspector page__

## Running JSInspector Server

#### Installing
```bash
git clone https://github.com/switer/jsinspector.git jsinspector
```

#### Starting Server
JSInspector server require [node.js](http://nodejs.org). After install node , running server with [npm](http://npmjs.org) (node.js package manager).
```bash
cd ./jsinspector
npm i
npm start
```

### Visit Home Page And Inject The Script
Inject the __script__ (which has an inspector id) from __home page__ to remote website, then visit __inspector__ (your can get then link on home page):
```bash
## home page
https://yourhost:port/
## inspector page
https://yourhost:port/devtools?xxx-xxx
```

## Usage
#### HTML sync
is the primary feature, all the html of client will be synchroized to remote server and can be view on
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
