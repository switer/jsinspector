![jsinspector](http://switer.github.io/live/images/jsinspector.png)
===================================================================
[![npm version](https://badge.fury.io/js/jsinspector.svg)](https://badge.fury.io/js/jsinspector)

Mobile debug toolkit, include **console.log**, **HTML Inspector** and **script inject api**.

<center>![show](http://7rf30v.com1.z0.glb.clouddn.com/jsinspector.gif)</center>

## Install and Run
For [node](http://nodejs.org) via [npm](http://npmjs.org):
```bash
npm install jsinspector -g
```

```bash
jsinspector server
```

The server's **port** default to 9000, open `Dashboard` page in browser:
```url
http://localhost:9000
```
> Note: use `jsinspector server --port PORT` to start server with specified port.


## Features

- **Console from Remote**

Support console of `log`, `clear`, `error`, `info`, `warn`, `time` and `timeEnd`:

```javascript
console.log(window); // -> {xxx: 'String', xxx2: 'Function', ..., window: 'Global'} 
console.log(document); // -> {xxx: 'String', xxx2: 'Function', ..., body: 'HTMLBodyElement'}
```
<center>![console sync](http://7rf30v.com1.z0.glb.clouddn.com/console.png)</center>

- **Execute Script**

Using `inject` method to execute script in remote browser:
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