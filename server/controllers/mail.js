import fetch from 'node-fetch';
import fs from 'fs'
import FormData from 'form-data';

export const addSubscriber = async (req, res) => {
    const { address, name, subscribed } = req.body;
    console.log(req.body)
    const form = new FormData();
    form.append('address',address);
    form.append('name',name);
    form.append('subscribed',subscribed);
    form.append('upsert','true');


    const listAddress = process.env.MAILGUN_LIST_ADDRESS;
    const resp = await fetch(
        `https://api.mailgun.net/v3/lists/${listAddress}/members`,
        {
          method: 'POST',
          headers: {
            Authorization: 'Basic ' + Buffer.from(`<username>:${process.env.MAILGUN_API_KEY}`).toString('base64')
          },
          body: form
        }
      );
    
      const data = await resp.json();
      console.log(data);
    
    try {
        res.status(200).json(data);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const notifySubscribers = async (req, res) => {
    //const {date} = req.body;
    try {
        res.status(200).json({message: "Notify everyone"});
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}
export const getSubscribers = async (req, res) => {
    //const {date} = req.body;
    try {
        const listAddress = process.env.MAILGUN_LIST_ADDRESS;
        const resp = await fetch(
            `${process.env.MAILGUN_BASE_URL}lists/${listAddress}/members`,
            {
            method: 'GET',
            headers: {
                Authorization: 'Basic ' + Buffer.from(`<username>:${process.env.MAILGUN_API_KEY}`).toString('base64')
            }
            }
        );

        const data = await resp.text();
        console.log(data);

        const finalData = JSON.stringify(JSON.parse(data),null,2);

        // fs.writeFileSync('./hola.json',finalData,'utf-8');


        // const parseado = JSON.parse(data)

        // parseado.items.forEach(element => {
        //     if(element.address ){
        //         console.log(element.address);
        //     }
        // });
        res.status(200).json({subs: JSON.parse(data).items});
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}