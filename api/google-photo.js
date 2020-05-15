'use strict'

const got = require('got')

module.exports = {
  readAlbums,
  createAlbum,
  uploadImage,
  storeImageInAlbum
}

function readAlbums (at) {
  // ! ignore pagination for now
  return got.get('https://photoslibrary.googleapis.com/v1/albums', {
    searchParams: {
      pageSize: 50,
      excludeNonAppCreatedData: true
    },
    headers: {
      Authorization: `Bearer ${at}`
    },
    resolveBodyOnly: true,
    responseType: 'json'
  })
}

function createAlbum (at, title) {
  return got.post('https://photoslibrary.googleapis.com/v1/albums', {
    headers: {
      Authorization: `Bearer ${at}`
    },
    resolveBodyOnly: true,
    responseType: 'json',
    json: {
      album: {
        title: title,
        isWriteable: true
      }
    }
  })
}

function uploadImage (at, mime, buffer) {
  return got.post('https://photoslibrary.googleapis.com/v1/uploads', {
    headers: {
      Authorization: `Bearer ${at}`,
      'Content-type': 'application/octet-stream',
      'X-Goog-Upload-Content-Type': mime,
      'X-Goog-Upload-Protocol': 'raw'
    },
    resolveBodyOnly: true,
    body: buffer
  })
}

function storeImageInAlbum (at, photoName, imageToken, album) {
  return got.post('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
    headers: {
      Authorization: `Bearer ${at}`
    },
    resolveBodyOnly: true,
    responseType: 'json',
    json: {
      albumId: album,
      newMediaItems: [
        {
          simpleMediaItem: {
            fileName: photoName,
            uploadToken: imageToken
          }
        }
      ]
    }
  })
}
