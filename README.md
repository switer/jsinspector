![jsinspector](http://switer.github.io/live/images/jsinspector.png)
===================================================================

**JSInspector** using a easy and simple way to inpsect website that from another device .

<center>![show](http://7rf30v.com1.z0.glb.clouddn.com/jsinspector.gif)</center>

## Install and Run
For [node](http://nodejs.org) via [npm](http://npmjs.org):
```bash
npm install jsinspector -g

jsinspector server
```
JSInspector server's port default is 9000, open `Dashboard` page in browser:
```url
http://localhost:9000
```

## Usage
Open **device** device dashboard, 

## More Features

- **Console**

<center>![console sync](http://7rf30v.com1.z0.glb.clouddn.com/console.png)</center>

Support console of `log`/`clear`/`error`/`info``warn`, `time` and `timeEnd`:

```javascript
console.log(window); // -> {xxx: 'String', xxx2: 'Function', ..., window: 'Global'} 
console.log(document); // -> {xxx: 'String', xxx2: 'Function', ..., body: 'HTMLBodyElement'}
```

- **Excute Script**

Using `inject` method to excute script in remote browser:
```js

inject('console.log("window")')

// block codes
inject(function () {
    console.log(document)
})

// insert external script
inject.js('http://yourhost/lib.js')

// insert external style sheet
inject.css('http://yourhost/style.css')
```


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
