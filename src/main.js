const config = {
	log_messages_sent: true, // outputs stuff to the console

	message_to_spam_chat: 'hi, dm me if you like cheese!', // this can also be an array
	spam_in_main_chat: false,
	spam_in_main_chat_delay: 5000, // how long to wait before sending another message (ms)
	stop_after_certain_ammount: false,
	stop_after_how_many_times: 10, // how many messages to send before stopping

	message_to_spam_dms: 'hi there, do you like cheese?', // this can also be an array
	spam_peoples_dms: false,
	spam_peoples_dms_delay: 3200, // how long to wait before switching to sending to another person (ms)
	block_person_after_sent: false,
	stop_after_sent_to_everyone: false,

	message_to_send_new_user: 'CHEESE', // this can also be an array
	message_new_user: true,
	message_new_user_cooldown: 5000
};

const postRequest = (url, data) => {
	$.ajax({
		url: url,
		type: 'post',
		caches: false,
		dataType: 'json',
		data: data
	});
};

const sendPublicMessage = (message) => {
	postRequest('system/action/chat_process.php', {
		content: message,
		quote: getQuote()
	});
};

const sendPrivateMessage = (message, target = currentPrivate) => {
	postRequest('system/action/private_process.php', {
		target: target,
		content: message,
		quote: getPrivateQuote()
	});
};

const getName = (id) => {
	const element = document.querySelector(`[data-id="${id}"]`);
	if (element) return element.getAttribute('data-name');

	return 'unknowed';
};

const getId = (name) => {
	const element = document.querySelector(`[data-name="${name}"]`);
	if (element) return Number(element.getAttribute('data-id'));

	return 0;
};

const getIds = () => {
	return new Promise((resolve) => {
		const ids = [];

		$.post('system/panel/user_list.php', {}, function(res) {
			$('#chat_right_data').html(res);
			document.querySelectorAll('#chat_right_data .user_item').forEach(item => {
				const id = item.getAttribute('data-id');
				const rank = item.getAttribute('data-rank');

				if (id && rank < 70) ids.push(id);
			});

			resolve(ids);
		});
	});
};

const delay = (time) => new Promise(res => setTimeout(res, time));

const initSpamDms = async () => {
	if (!config.spam_peoples_dms) return;

	while (true) {
		const sentTo = new Set();
		const ids = await getIds();

		let timesSent = 1;

		for (const id of ids) {
			const message = Array.isArray(config.message_to_spam_dms) ? config.message_to_spam_dms[Math.floor(Math.random() * config.message_to_spam_dms.length)] : config.message_to_spam_dms;

			sendPrivateMessage(message, id);

			if (config.log_messages_sent) console.log(`Sent "${message}" to ${getName(id)} (${timesSent}/${ids.length}).`);
			if (config.block_person_after_sent) ignoreUser(id);

			sentTo.add(id);
			timesSent++;

			await delay(config.spam_peoples_dms_delay);
		};

		if (config.stop_after_sent_to_everyone && sentTo.size === ids.length) {
			console.log('done spamming dms.');
			break;
		};

		console.log('done spamming dms, resending...');
	};
};

const initSpamMainChat = async () => {
	if (!config.spam_in_main_chat) return;

	let timesSent = 0;

	while (true) {
		const message = Array.isArray(config.message_to_spam_chat) ? config.message_to_spam_chat[Math.floor(Math.random() * config.message_to_spam_chat.length)] : config.message_to_spam_chat;

		sendPublicMessage(message);

		if (config.log_messages_sent) console.log(`sent "${message}" to main chat (${timesSent}).`);
		timesSent++;

		if (config.stop_after_certain_ammount && timesSent >= config.stop_after_how_many_times) {
			console.log(`done spamming main chat after ${timesSent} times.`);
			break;
		};

		await delay(config.spam_in_main_chat_delay);
	};
};

const initSendToNewUser = async () => {
	if (!config.message_new_user) return;

	let prevIds = new Set(await getIds());
	let lastSent = 0;
	let timesSent = 1;

	while (true) {
		const currentIds = new Set(await getIds());

		for (const id of currentIds) {
			if (!prevIds.has(id)) {
				const name = getName(id);
				const currentTime = Date.now();

				if (currentTime - lastSent >= config.message_new_user_cooldown) {
					const message = Array.isArray(config.message_to_send_new_user) ? config.message_to_send_new_user[Math.floor(Math.random() * config.message_to_send_new_user.length)] : config.message_to_send_new_user;

					sendPrivateMessage(message, id);

					if (config.log_messages_sent) console.log(`Sent "${message}" to ${name} (${timesSent}).`);

					timesSent++;
					lastSent = currentTime;
				};
			};
		};

		prevIds = currentIds;
		await delay(config.message_new_user_cooldown);
	};
};

// main
(async () => {
	await Promise.all([
		initSpamDms(),
		initSpamMainChat(),
		initSendToNewUser()
	]);
})();
