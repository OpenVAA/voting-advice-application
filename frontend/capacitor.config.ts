import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'com.voting.advice.app',
	appName: 'voting-advice-application',
	webDir: 'build',
	bundledWebRuntime: false,

	// change the url value to the IP address that your workstation is available through internet.
	server: {
		url: 'http://192.168.101.143:5173',
		cleartext: true
	}
};

export default config;
