class Storage {
  constructor (chunkLength, opts = {}) {

    //if (!window.indexedDB) throw new Error('indexedDB not supported')

    this.open = window.indexedDB.open('ZeroTube', 1)

    this.chunkLength = Number(chunkLength)
    if (!this.chunkLength) throw new Error('First argument must be a chunk length')

    this.chunks = []
    this.closed = false
    this.length = Number(opts.length) || Infinity

    if (this.length !== Infinity) {
      this.lastChunkLength = (this.length % this.chunkLength) || this.chunkLength
      this.lastChunkIndex = Math.ceil(this.length / this.chunkLength) - 1
    }

    this.close = this.destroy

  }

  put (index, buf, cb) {
    if (this.closed) return nextTick(cb, new Error('Storage is closed'))

    var isLastChunk = (index === this.lastChunkIndex)
    if (isLastChunk && buf.length !== this.lastChunkLength) {
      return nextTick(cb, new Error('Last chunk length must be ' + this.lastChunkLength))
    }
    if (!isLastChunk && buf.length !== this.chunkLength) {
      return nextTick(cb, new Error('Chunk length must be ' + this.chunkLength))
    }
    this.chunks[index] = buf
    nextTick(cb, null)
  }

  get (index, opts, cb) {
    if (typeof opts === 'function') return this.get(index, null, opts)
    if (this.closed) return nextTick(cb, new Error('Storage is closed'))
    var buf = this.chunks[index]
    if (!buf) return nextTick(cb, new Error('Chunk not found'))
    if (!opts) return nextTick(cb, null, buf)
    var offset = opts.offset || 0
    var len = opts.length || (buf.length - offset)
    nextTick(cb, null, buf.slice(offset, len + offset))
  }

  destroy (cb) {
    if (this.closed) return nextTick(cb, new Error('Storage is closed'))
    this.closed = true
    this.chunks = null
    nextTick(cb, null)
  }

}

function nextTick (cb, err, val) {
  process.nextTick(function () {
    if (cb) cb(err, val)
  })
}

export default Storage
