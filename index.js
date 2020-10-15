var tcp = require('../../tcp');
var instance_skel = require('../../instance_skel');

var debug;
var log;

class instance extends instance_skel {

	constructor(system,id,config){
		super(system,id,config);

		this.actions();
	}

	//Setup the actions
	actions(system) {

		this.setActions({
			'cc': {
				label: 'Fire Custom Control',
				options: [
					{
						type: 'number',
						label: 'Bank',
						id: 'bank',
						default: 1,
						min: 1,
						max: 48
					},
					{
						type: 'number',
						label: 'CC',
						id: 'cc',
						default: 1,
						min: 1,
						max: 48
					}
				]
			}
		});
	}

	//Execute the provided action
	action(action) {
		let opt = action.options;
		let cmd;

		switch (action.action) {

			case 'cc':
				let cc = (opt.cc > 9 ? '' : '0') + opt.cc;
				cmd = 'CC ' + opt.bank + cc;
				break;
		}

		if (cmd != undefined){
			
			this.debug('sending tcp ', cmd, ' to', this.config.host);
			
			if (this.socket !== undefined && this.socket.connected) {
				this.socket.send(cmd + '\r\n');
			}
			else {
				this.debug('Socket not connected :(');
			}
		}
	}

	//Define instance config fields
	config_fields() {
		return [
			{
				type: 'text',
				id:   'info',
				width: 12,
				label: 'Information',
				value: 'Trigger Custom Controls on Ross Caprica - Part of the Overdrive system'
			},
			{
				type: 'textinput',
				id:   'host',
				label: 'Caprica IP/Hostname',
				default: '',
				width: 6,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Caprica RTalk-IN Port',
				width: 4,
				regex: this.REGEX_PORT,
				default: '7788'
			}
		]
	}

	//Clean up before destroy
	destroy() {
		if (this.socket !== undefined) {
			this.socket.destroy();
		}
		this.debug('DESTROY ', this.id);
	}

	init() {
		debug = this.debug;
		log = this.log;

		this.initTCP();
	}

	initTCP() {
		if (this.socket !== undefined) {
			this.socket.destroy();
			delete this.socket;
		}

		if (this.config.port === undefined){
			this.config.port = 7788;
		}

		if (this.config.host) {
			this.status(this.STATUS_WARNING, 'Connecting');
			this.socket = new tcp(this.config.host, this.config.port);

			this.socket.on('status_change', (status, message) => {
				this.status(status, message);
			});

			this.socket.on('error', (err) => {
				this.debug("Network error", err);
				this.status(this.STATUS_ERROR, err);
				this.log('error', "Network error: " + err.message);
			});

			this.socket.on('connect', () => {
				this.debug("Connected");
				this.status(this.STATUS_OK);
				this.log("Connection Established");
			});

		}
	}

	//Apply new config when changed
	updateConfig(config) {
		var resetConnection = false;

		if (this.config != config) {
			resetConnection = true;
		}

		this.config = config;

		if (resetConnection === true || this.socket === undefined) {
			this.initTCP();
		}
	}
}

exports = module.exports = instance;