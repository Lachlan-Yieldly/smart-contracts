import React, { useState } from "react"
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Select from '@material-ui/core/Select';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';

const useStyles = makeStyles((theme) => ({
    formControl: {
        margin: theme.spacing(1),
        minWidth: 120,
    },
}));

const Navbar = () => {
    const classes = useStyles();


    const connect = async () => {
        await AlgoSigner.connect();
    }

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography variant="h6">
                    Yieldly Testbed
                </Typography>
               
                <Button variant="contained" color="secondary"
                    onClick={() => { connect() }}>Connect</Button>
            </Toolbar>
        </AppBar>
    )
}
export default Navbar