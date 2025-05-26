// importaciones
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require("baileys")
const qrcode = require("qrcode-terminal");

// función para conectar WhatsApp
async function conectarWhatsapp(){
    const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys")
    const sock = makeWASocket({
        auth: state
    });
    sock.ev.on('creds.update', saveCreds)

    // evento de conexión
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            qrcode.generate(qr, { small: true });
        }
        if(connection === 'close'){
            const puedoConectar = lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut;
            if(puedoConectar){
                conectarWhatsapp()
            }
        } else if(connection == 'open'){
            console.log("CONEXIÓN ABIERTA!!!");
            // Listar todos los grupos
            try {
                const grupos = await sock.groupFetchAllParticipating();
                console.log("Grupos donde el número está vinculado:");
                Object.values(grupos).forEach(g => {
                    console.log(`- ${g.subject} (${g.id})`);
                });
            } catch (err) {
                console.error("Error al obtener los grupos:", err);
            }
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

        // guardar nombre de contacto
        const nombre = event.messages[0].pushName;

        // lectura de mensaje (confirmar que lo leímos)
        //await sock.readMessages([message.key]);

        // animación de escribiendo de whatsapp
        await sleep(100)
        await sock.sendPresenceUpdate('composing', id)
        await sleep(5000)

        // enviar mensaje
        // await sock.sendMessage(id, {text: "Hola, soy un bot, en que te puedo ayudar"})
        
        // responder mensaje
        await sock.sendMessage(id, {text: "Hola " + nombre + ", esta es un respuesta automatica, en este momento no estoy disponible, deje se mensaje y reponderé en cuanto sea posible. Gracias...!!!"})

        // Enviar mensaje a un grupo específico
        const grupoId = "120363304200372914@g.us"; // Reemplaza por el ID real de tu grupo
        try {
            await sock.sendMessage(grupoId, {text: `Mensaje automático: El bot ha respondido a ${nombre}`});
        } catch (err) {
            console.error("Error al enviar mensaje al grupo específico:", err);
        }

        // menciones
        //await sock.sendMessage(id, {
        //    text: "Hola @59178194371",
        //    mentions: ["@59178194371@s.whatsapp.net"]
        //})

        // enviar ubicación
        //await sock.sendMessage(id, {location: { 
        //    degreesLatitude: "-17.315760347154626",
        //    degreesLongitude: "-63.263517187627826",
        //    address: "Av. 123, Zona: ABCD. (centro)"
        //}})
    })

}

conectarWhatsapp()

function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));

}
