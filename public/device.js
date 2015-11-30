/**
 * Clients app entry
 */
!function (){
	'use strict';

	var socket = io.connect(window.location.origin + '/device')
	function $get(options, success, error) {
	    var xhr = new XMLHttpRequest();
	    xhr.onreadystatechange = function() {
	        if (xhr.readyState == 4 && xhr.status == 200 && xhr.responseText) {
	            success && success(xhr.responseText, xhr);
	        } else if (xhr.readyState == 4 && xhr.status != 200) {
	            error && error(xhr.response, xhr);
	        }
	    }
	    xhr.open('GET', options.url);
	    xhr.send(null);
	}
	var script = '<script src="$host/s" ></script>'.replace('$host', location.origin)
	Zect.namespace('r')
	new Zect({
	    el: '#app',
	    data: function() {
	        return {
	            clients: [],
	            clientInfos: {},
	            activeDevice: '',
	            inited: false,
	            hoverMask: false,
	            script: script,
	            copyScript: script
	        }
	    },
	    ready: function() {
	    	this._$previewFrame = this.$el.querySelector('.previewFrame')
	    	this.$data.inited = true
	        this.fetch()
	        socket.on('device:update', function() {
	            this.fetch()
	        }.bind(this))

	        var client = new ZeroClipboard( this.$el.querySelector(".copy") );
	        var vm = this
	        var pendding
			client.on( "ready", function( readyEvent ) {
				client.on( "aftercopy", function( event ) {
					if (pendding) return
					vm.$data.script = 'Copy success, paste it into HTML Document ~'
					pendding = true
					setTimeout(function () {
						pendding = false
						vm.$data.script = script
					}, 1500)
				});
			});
	    },
	    methods: {
	        fetch: function() {
	            var vm = this
	            $get({
	                url: '/clients'
	            }, function(data) {
	                data = JSON.parse(data)
	                vm.$data.clientInfos = data
	                vm.$data.clients = Object.keys(data).map(function(k) {
	                    var item = data[k]
	                    return {
	                        cid: item.clientId,
	                        ua: item.userAgent,
	                        info: detect.parse(item.userAgent)
	                    }
	                })
	            })
	        },
	        onPreview: function (e) {
	        	var cid = e.currentTarget.dataset.cid
	        	this.$data.activeDevice = cid
	        	this.updatePreview(cid)
	        },
	        onView: function () {
	        	if (!this.$data.activeDevice) return

	        	window.open('/inspector.html?cid=' + this.$data.activeDevice, 'jsinspector:this.$data.activeDevice')
	        },
	        onHoverMask: function () {
	        	this.$data.hoverMask = true
	        },
	        onLeaveMask: function () {
	        	this.$data.hoverMask = false
	        },
	        updatePreview: function(cid) {
	        	this._$previewFrame.src = '/preview/' + cid
	        }
	    }
	})
}();
