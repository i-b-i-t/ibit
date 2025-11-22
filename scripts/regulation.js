import { world } from "@minecraft/server";

export default function init(){}

const MAXIMUM_CHAT_LENGTH = 128;

world.beforeEvents.chatSend.subscribe(data=>{
    data.cancel = true;
    let purified = data.message.replaceAll(/§+.?/g, ""), exceeds = false;
    if(purified.length > MAXIMUM_CHAT_LENGTH) {
        exceeds = true;
        purified = purified.substring(0, MAXIMUM_CHAT_LENGTH);
    }
    if(purified.startsWith("> ")) world.sendMessage(`<${data.sender.nameTag}> §a${purified.substring(2)}`);
    else world.sendMessage(`<${data.sender.nameTag}> ${purified}`);
    if(exceeds) data.sender.sendMessage(`§cMaximum chat length is ${MAXIMUM_CHAT_LENGTH}. Your message has been truncated.`);
});