const config = {
	message_to_spam_chat: 'hi, dm me if you like cheese!',
	spam_in_main_chat: false,
	spam_in_main_chat_delay: 5000, // ms
	stop_after_how_many_times: 10, // how many messages to send before stopping

	message_to_spam_dms: 'hi there, do you like cheese?',
	spam_peoples_dms: true,
	spam_peoples_dms_delay: 5550, // how fast to switch to sending to another person
	log_messages_sent: true, // outputs stuff to the console
	block_person_after_sent: false
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
	return 'NN';
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

	const ids = await getIds();

	let timesSent = 1;
	for (const id of ids) {
		sendPrivateMessage(config.message_to_spam_dms, id);

		if (config.log_messages_sent) console.log(`Sent "${config.message_to_spam_dms}" to ${getName(id)} (${timesSent}).`);
		if (config.block_person_after_sent) ignoreUser(id);

		timesSent++;

		await delay(config.spam_peoples_dms_delay);
	};

	console.log('Done spamming DMs.');
};

const initSpamMainChat = async () => {
	if (!config.spam_in_main_chat) return;

	let timesSent = 0;
	while (config.spam_in_main_chat && timesSent < config.stop_after_how_many_times) {
		sendPublicMessage(config.message_to_spam_chat);

		if (config.log_messages_sent) console.log(`Sent "${config.message_to_spam_chat}" to main chat.`);

		timesSent++;

		await delay(config.spam_in_main_chat_delay);
	};

	console.log(`Done spamming main chat after ${timesSent} times.`);
};

// main
(async () => {
	await Promise.all([
		initSpamDms(),
		initSpamMainChat()
	]);
})();
