const puppeteer = require('puppeteer');
const moment = require('moment');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const {EOL} = require('os');
const config = require('./config.js');

function getPercentFromElementHandle (node){
	return Number($(node).parent()[0].innerHTML.split('</i>')[1].trim().split('%')[0]);
}

async function findProposals(page) {
	await page.goto('https://vote.smartcash.cc/');

	const proposalContainers = await page.$$('.list-proposal');
	const proposals = [];

	for (const prop of proposalContainers) {
		const propTitle = await prop.$eval('.proposal-title > a', node => node.innerHTML);
		const deadlineMoment = moment(`${await prop.$eval('[data-countdown]', node => node.dataset.countdown)} +0000`, 'YYYY/MM/DD HH:mm:ss Z');
		const yesVotesPercent = await prop.$eval('.fa-thumbs-up', getPercentFromElementHandle);
		const noVotesPercent = await prop.$eval('.fa-thumbs-down', getPercentFromElementHandle);
		const neutralVotesPercent = await prop.$eval('.fa-hand-paper-o', getPercentFromElementHandle);
		const proposalId = await prop.$eval('.btn-atividade[href^="/Proposal/Details/"]', node => node.href.split('https://vote.smartcash.cc/Proposal/Details/')[1]);

		proposals.push({
			id: proposalId,
			title: propTitle,
			deadline: deadlineMoment,
			yes: yesVotesPercent,
			no: noVotesPercent,
			neutral: neutralVotesPercent
		});
	}

	return findProposalsToConsider(proposals);
}

function findProposalsToConsider(proposals) {
	return proposals.filter((prop) => {
		return prop.deadline.diff(moment(), 'days', true) < 1.5;
	});
}

function findDecision({yes, no, neutral}) {
	if (neutral >= yes || neutral >= no) {
		return 2;
	}

	return yes > no ? 1 : 0;
}

async function getSignature({id}) {
	const signatures = [];

	for (const addr of config.VOTE_ADDRESSES) {
		const {stdout} = await exec(`${config.CLI_PATH} -rpcconnect=${config.RPC.HOST} -rpcport=${config.RPC.PORT} -rpcuser=${config.RPC.USER} -rpcpassword=${config.RPC.PASS} signmessage ${addr} ${id}`);

		signatures.push({addr, signature: JSON.parse(JSON.stringify(stdout.replace(EOL, '')))});
	}

	return signatures;
}

async function vote(page, id, address, signature, decision) {
	await page.goto(`https://vote.smartcash.cc/Proposal/Details/${id}`);

	await page.type('[type=search]', address);
	await page.waitFor(5000);
	
	try {
		await page.$eval('a[target=_blank].alignLeft', node => node.innerHTML);

		console.log(`Already Voted for: ${id} - ${address}`);
	} catch (err) {
		console.log(`Voting for ${id} - ${address} - ${signature}`);

		await page.click('.btn-atividade:last-of-type');
		await page.waitForSelector('input[name=Address]');
		await page.waitFor(2500);
		await page.type('input[name=Address]', address, {delay: 100});
		await page.type('input[name=Signature]', signature, {delay: 100});
		await page.waitFor(2500);

		if (decision === 1) {
			await page.click('#pnlVote .btn.btn-block.btn-success.btn-lg'); //yes
		} else if (decision === 0) {
			await page.click('#pnlVote .btn.btn-block.btn-danger.btn-lg'); //no
		} else if (decision === 2) {
			await page.click('#pnlVote .btn.btn-block.btn-secondary.btn-lg'); //neutral
		}

		await page.waitFor(10000);
	}
}

(async () => {
	const browser = await puppeteer.launch({
		headless: config.HIDE_CHROME
	});
	const page = await browser.newPage();

	const proposals = await findProposals(page);

	for (const prop of proposals) {
		prop.vote = findDecision(prop);
		prop.signatures = await getSignature(prop);
	}

	for (const prop of proposals) {
		for (const {addr, signature} of prop.signatures) {
			await vote(page, prop.id, addr, signature, prop.vote);
		}
	}

	await browser.close();
})();
