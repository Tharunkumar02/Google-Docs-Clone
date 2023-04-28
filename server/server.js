const mongoose = require("mongoose")
const Document = require('./doc')

mongoose.connect('mongodb://localhost/google-docs-clone', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

    .catch((err) => {
        console.log(err)
    })

const io = require('socket.io')(3001, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
})

io.on('connection', socket => {
    socket.on('get-document', documentId => {
        const document = findOrCreateDocument(documentId)
        socket.join(documentId)
        socket.emit("load-document", document.data)

        socket.on('send-changes', delta => {
            socket.broadcast.to(documentId).emit('receive-changes', delta)
        })

        socket.on("save-document", async document => {
            await Document.findByIdAndUpdate(documentId, { data: document })
        })
    })

})

async function findOrCreateDocument(id) {
    if (id == null) return

    const document = await Document.findById(id)
    if (document) return document
    return await Document.create({ _id: id, data: "" })
}