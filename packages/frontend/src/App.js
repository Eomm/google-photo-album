import Button from '@material-ui/core/Button'
import Container from '@material-ui/core/Container'
import CssBaseline from '@material-ui/core/CssBaseline'
import FormControl from '@material-ui/core/FormControl'
import Grid from '@material-ui/core/Grid'
import InputLabel from '@material-ui/core/InputLabel'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import MenuItem from '@material-ui/core/MenuItem'
import Select from '@material-ui/core/Select'
import { makeStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import React, { useState, useEffect } from 'react'
import ImageUploader from 'react-images-upload'
import Cookies from 'js-cookie'
import './App.css'

function App () {
  const [cookie] = useState(Cookies.get('acg'))

  const [state, setState] = useState({
    pictures: [],
    album: null
  })

  const [newAlbum, setNewAlbumState] = useState('')
  const [albums, setAlbums] = useState([])

  useEffect(() => {
    if (cookie) {
      loadAlbum()
    }
  }, [cookie])

  function onDrop (picture) {
    setState({ album: state.album, pictures: state.pictures.concat(picture) })
  }

  function selectAlbum (event) {
    setState({ album: event.target.value, pictures: state.pictures })
  }

  function inputNewAlbum (event) {
    setNewAlbumState(event.target.value)
  }

  function createNewAlbum () {
    window.fetch('/api/album/create', {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title: newAlbum })
    })
      .then(response => response.json())
      .then(function (json) {
        console.log('Request succeeded with JSON response', json)
        // TODO show message
      })
      .catch(function (error) {
        console.log('Request failed', error)
        // TODO show alert
      })
  }

  function loadAlbum () {
    window.fetch('/api/album/list', {
      credentials: 'include'
    })
      .then(response => response.json())
      .then(function (json) {
        console.log('Request succeeded with JSON response', json)
        setAlbums(json)
      })
      .catch(function (error) {
        console.log('Request failed', error)
        // TODO show alert
      })
  }

  function uploadImages () {
    const formData = new window.FormData()

    formData.append('album', state.album)
    state.pictures.forEach(_ => {
      formData.append('importFile', _)
    })

    window.fetch('/api/album/upload', {
      method: 'post',
      // headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: formData
    })
      .then(response => response.json())
      .then(function (json) {
        console.log('Request succeeded with JSON response', json)
        // TODO show message
        setState({ album: state.album, pictures: [] })
      })
      .catch(function (error) {
        console.log('Request failed', error)
        // TODO show alert
      })
  }

  const classes = makeStyles((theme) => ({
    paper: {
      marginTop: theme.spacing(8),
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    },
    avatar: {
      margin: theme.spacing(1),
      backgroundColor: theme.palette.secondary.main
    },
    form: {
      width: '100%', // Fix IE 11 issue.
      marginTop: theme.spacing(3)
    },
    submit: {
      margin: theme.spacing(3, 0, 2)
    },
    formControl: {
      margin: theme.spacing(1),
      minWidth: 120
    }
  }))()

  return (
    <Container component='main' maxWidth='xs'>
      <CssBaseline />
      <div className={classes.paper} style={!cookie ? {} : { display: 'none' }}>
        <Typography component='h1' variant='h5'>
          Learn by image
        </Typography>
        <Button
          href='/api/login/google'
          fullWidth
          variant='contained'
          color='primary'
          className={classes.submit}
        >
            Login with Google
        </Button>
      </div>
      <div className={classes.paper} style={cookie ? {} : { display: 'none' }}>
        <form className={classes.form} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name='albumName'
                variant='outlined'
                fullWidth
                id='albumName'
                label='Album name'
                onChange={inputNewAlbum}
                value={newAlbum || ''}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant='contained'
                color='primary'
                onClick={createNewAlbum}
                disabled={!newAlbum}
              >Create new album
              </Button>
            </Grid>

            <Grid item xs={12}>
              <ImageUploader
                withIcon
                buttonText='Choose images'
                onChange={onDrop}
                imgExtension={['.jpg', '.gif', '.png', '.gif']}
                maxFileSize={5242880}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography hidden={state.pictures.length === 0} variant='h6' className={classes.title}>Images to upload</Typography>
              <div className={classes.demo}>
                <List dense>
                  {(state.pictures.map(_ => (<ListItem><ListItemText primary={_.name} /></ListItem>)))}
                </List>
              </div>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl variant='outlined' className={classes.formControl}>
                <InputLabel id='album-select-outlined-label'>Album</InputLabel>
                <Select
                  labelId='album-select-label'
                  id='album-select'
                  value={state.album}
                  onChange={selectAlbum}
                >
                  {(albums.map(_ => (<MenuItem value={_.id}>{_.title}</MenuItem>)))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                fullWidth
                variant='contained'
                color='primary'
                className={classes.submit}
                disabled={state.pictures.length === 0 || !state.album}
                onClick={uploadImages}
              >Upload
              </Button>
            </Grid>
          </Grid>
        </form>
      </div>
    </Container>
  )
}

export default App
