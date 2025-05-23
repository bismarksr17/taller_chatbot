// importaciones
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("baileys")

// función para conectar WhatsApp
async function conectarWhatsapp(){
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys")
    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true
    });
    sock.ev.on('creds.update', saveCreds)

    // evento de conexión
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'close'){
            const puedoConectar = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if(puedoConectar){
                conectarWhatsapp()
            }
        } else if(connection == 'open'){
            console.log("CONEXIÓN ABIERTA!!!");

            // Listar grupos donde está el bot
            const grupos = await sock.groupFetchAllParticipating();
            console.log("Grupos donde está el bot:");
            Object.values(grupos).forEach(grupo => {
                console.log(`- ${grupo.subject} (${grupo.id})`);
            });
        }
    });

    // recibir mensaje
    sock.ev.on('messages.upsert', async function (event){
        console.log(event);
        
        const type = event.type;
        const message = event.messages[0];
        const id = message.key.remoteJid;

        if (type != 'notify' || message.key.fromMe || id.includes("@g.us") || id.includes("@broadcast")) {
            return
        }

        // enviar mensaje
        await sock.sendMessage(id, {text: "Hola, soy un bot, en que te puedo ayudar"})

    })

}

conectarWhatsapp()