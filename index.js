import puppeteer from 'puppeteer';
// import puppeteer from 'puppeteer-core';
// import chromium from "@sparticuz/chromium";
// import { app } from '@azure/functions';
import express from 'express';
import locateChrome from 'locate-chrome';
import crypto from 'crypto';

// App constants
const host = "::" // listen to all IPs both IPv4 and IPv6
let port = parseInt(process.env.PORT) || 3000;

const app = express();
app.use(express.json())

app.post('/', async (request, response) => {
    // console.log(`Http function processed request for url "${request.url}"`);
    // const { username, password, project, name, lastname, type_intervention, date, type_event, event_caracter, responsible, description } = request.body;
    const { encrypted_text, project, type_intervention, date, type_event, event_caracter, responsible } = request.body;
    
    let username, password, name, lastname, description;
    [username, password, name, lastname, description] = await decrypt(encrypted_text);

    // console.log(request);
    console.log(request.body);
    // console.log(username, password, name, lastname, description);

    // console.log(username, password, project, name, lastname, type_intervention, date, type_event, event_caracter, responsible, description);

    const lastname_array = lastname.split(" ")
    const url = 'https://www.sis.mejorninez.cl/';
    // console.log('Pase por aca')
    const result = await scraper(response, url, username, password, project, name, lastname_array[0], lastname_array[1], type_intervention, date, type_event, event_caracter, responsible, description);

    // return result;

    // res.send('Data received successfully!');
});

async function decrypt(text) {
    const key = "jOJPKfAAYva8dPDYitNkOxbCsteH5bNz";
    // console.log(key);
    // console.log(Buffer.from(key, 'utf-8'));

    const iv = 'NtZxUQZQKX8gIHhl';
    // console.log(iv);
    // console.log(Buffer.from(iv, 'utf-8'));

    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'utf-8'), Buffer.from(iv, 'utf-8'));
    let text_decrypt = decipher.update(text, 'base64', 'utf8');
    text_decrypt += decipher.final('utf8');
    const array_decrypt = text_decrypt.split("$");
    console.log(array_decrypt);
    return array_decrypt;
}

async function setUpPageDefaults(page) {
    await Promise.all([
        // page.setUserAgent(
        //     // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"
        //     "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36"
        // ),
        page.setExtraHTTPHeaders({
            'authority': 'a1.sis.mejorninez.cl',
            'accept': 'application/json, text/javascript, */*; q=0.01',
            "accept-encoding": "gzip, deflate, br, zstd",
            // "accept-language": "es-CL,es;q=0.9,en;q=0.8",
            "accept-language": "es-ES,es;q=0.9,en;q=0.8",
            'sec-ch-ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': "macOS",
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin',
            'user-agent':  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
        }),
    //   page.setViewport({ width: 1280, height: 800 }),
    ]);
}

async function getOptionValue(textSelect, targetText) {
    const optionsData = await textSelect.evaluate((select) => {
        return Array.from(select.options).map((option) => ({
            text: option.textContent?.trim(),
            value: option.value,
        }));
    });

    const matchingOption = optionsData.find(
      // (option) => option.text === targetText
        (option) => option.text.includes(targetText)
    );

    if (!matchingOption) {
        throw new Error(`${targetText} not found in dropdown options`);
    }

    return matchingOption.value;
}

async function scraper(response, url, username, password, project, name, lastname_1, lastname_2, type_intervention, date, type_event, event_caracter, responsible, description) {
    console.log('Entre al scraper')
    let browser;

    try{
        // const path = await chromium.executablePath();
        const path = '/usr/bin/chromium'
        // const path = await new Promise(resolve => locateChrome((arg) => resolve(arg))) || '';
        console.log(path);
        browser = await puppeteer.launch({
        headless: true,
        args: [
            // ...chromium.args,
            "--no-sandbox",
            "--disable-setuid-sandbox",
            // "--disable-dev-shm-usage",
            // "--disable-gpu",
            // "--single-process",
            // "--no-zygote",
            // "--disable-blink-features=AutomationControlled",
        ],
        // executablePath: "/opt/homebrew/bin/chromium",
        // executablePath: '/usr/bin/google-chrome',
        // executablePath: await chromium.executablePath(),
        executablePath: path,
        defaultViewport: {
            width: 1920,
            height: 1080,
        },
    });
    }
    catch(e){
        await browser.close();
        response.status(500);
        response.send(`No se pudo ejecutar la automatización. Error: ${e.message}`)
    }

    try{
        console.log('Cree browser')
        const page = await browser.newPage();
        await setUpPageDefaults(page);

        await page.goto(url);
        console.log('Entre a la pagina')
        await new Promise(res => setTimeout(res, 1000));
        // console.log(await page.content())
        // Landing page
        await page.type('#usuario', username);
        await page.type('#password', password);

        console.log('Ingrese usuario y contraseña')

        await new Promise(res => setTimeout(res, 1000));

        await Promise.all([
            page.waitForNavigation({waitUntil: 'networkidle2'}),
        page.click('#ingresar')
        ]);

        // Check if the is a pop up in home page
        page.waitForNetworkIdle();

        // const close_button = await page.waitForSelector('.close');
        // if (close_button) {
        //     page.click('.close')
        // }

        page.waitForNetworkIdle();

        await new Promise(res => setTimeout(res, 1000));

        console.log('Entre')

        // Home select from navbar
        page.click('#menu_colgante_menu_menu');
        // const menu = await page.waitForSelector('xpath///a[contains(text(), "Menú")]');
        // await menu.click();
        
        await new Promise(res => setTimeout(res, 1000));
        const submenu_1 = await page.waitForSelector('xpath///a[contains(text(), "Niños")]');
        await submenu_1.click();
        const submenu_2 = await page.waitForSelector('xpath///a[contains(text(), "Planes de Intervención")]');
        await submenu_2.click();
        const submenu = await page.waitForSelector('xpath///a[contains(text(), "Gestionar Plan de Intervención")]');

        await Promise.all([
            page.waitForNavigation({waitUntil: 'networkidle2'}),
        await submenu.click()
        ]);

        // Options in 'Gestionar Plan de Intervención'
        await page.type('#txt_name', name);
        await page.type('#txt_patern', lastname_1);
        await page.type('#txt_matern', lastname_2);

        let project_updated = project.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        project_updated = project_updated.toUpperCase();
        console.log(project_updated)

        const elem_proj = await page.waitForSelector('#ddown002');
        const proj = await getOptionValue(elem_proj, project_updated.substring(4));
        await page.waitForNetworkIdle();
        await page.select('#ddown002', proj);
        await page.waitForNetworkIdle();

        // console.log('Pase por aca')
        console.log('Datos búsqueda ok')

        await Promise.all([
            page.waitForNetworkIdle(),
            page.click('#btnbuscar')
        ]);

        let select_kid;
        try {
            await Promise.all([
                page.waitForNetworkIdle(),
                select_kid = await page.waitForSelector('xpath///a[contains(text(), "Seleccionar")]'),
                await select_kid.click()
            ]);
        } catch(e) {
            console.log('Niño no encontrado')
            await browser.close();
            await response.status(500);
            await response.send(`No se pudo ejecutar la automatización. Error: ${e.message}. NNA no encontrado.`) 
        }

        // console.log('Pase por aca')
        console.log('Seleccionado ok')

        await Promise.all([
            page.waitForNetworkIdle(),
            await page.click('#wib004')
        ]);

        await page.waitForNetworkIdle();

        // Pop up, add new 'Evento de Intervención'
        const frame = page
            .frames()
            .find((f) => f.url().includes("eventos_intervencion"));

        if (!frame) throw new Error("Frame not found");

        await Promise.all([
            page.waitForNetworkIdle(),
            await frame.click('#btnAgregar')
        ]);

        // console.log('Pase por aca')
        console.log('Boton agregar nuevo ok')

        // Add new Evento de Intervención
        await page.waitForNetworkIdle();

        const type_intervention_update = type_intervention.toUpperCase();
        console.log(type_intervention_update);
        
        const elem = await frame.waitForSelector('#ddlTipoIntervencion');
        const type_int = await getOptionValue(elem, type_intervention_update.substring(3));

        await page.waitForNetworkIdle();
        await frame.select('#ddlTipoIntervencion', type_int);
        await page.waitForNetworkIdle();

        // console.log(elem)
        console.log('Tipo intervencion ok')

        // await new Promise(res => setTimeout(res, 1000));

        const elem_2 = await frame.waitForSelector('#ddlTipoEvento');

        // console.log(elem_2)
        // console.log('Tipo evento ok')

        // const content = await frame.content()
        // console.log(content)

        // await new Promise(res => setTimeout(res, 1000));

        const type_ev = await getOptionValue(elem_2, type_event.toUpperCase());
        
        console.log('Tipo evento seleccionado')

        await page.waitForNetworkIdle();
        await frame.select('#ddlTipoEvento', type_ev);
        await page.waitForNetworkIdle();

        console.log('Tipo evento ok')

        try {
            // const caracter_not_blocked = await frame.waitForSelector('#ddlCaracterEvento')
            // if (caracter_not_blocked) {
                const elem_3 = await frame.waitForSelector('#ddlCaracterEvento', { timeout: 5000 });
                // const ev_car = await getOptionValue(caracter_not_blocked, event_caracter.toUpperCase());
                const ev_car = await getOptionValue(elem_3, event_caracter.toUpperCase());
            
                console.log('Hay caracter del evento')

                await page.waitForNetworkIdle();
                await frame.select('#ddlCaracterEvento', ev_car);
                await page.waitForNetworkIdle();
            // }
        } catch (e) {
            console.log('Caracter del evento bloqueado')
        }

        console.log('Entrando a responsable')

        await page.waitForNetworkIdle();
        const elem_4 = await frame.waitForSelector('#ddlResponsableTecnico');
        console.log(responsible.toUpperCase());

        let resp;
        let not_single_space = false;
        try {
            resp = await getOptionValue(elem_4, responsible.toUpperCase());
        } catch(e) {
            console.log('Tiene doble espacio en algun lado')
            not_single_space = true;
        }
        // const resp = await getOptionValue(elem_4, responsible.toUpperCase());
        
        let resp_list = responsible.toUpperCase().split(' ');
        let not_double_name_lastname = false;
        if (not_single_space) {
            console.log(responsible);
            // let resp_list = responsible.toUpperCase().split(' ');
            console.log(resp_list);
            // const lastnames = resp_list[-1] + " " + resp_list[-1];
            // const names = resp_list.join(" ");
            // const resp_more_spaces = names + "  " + lastnames;
            const largo = resp_list.length;
            for (let i = 0; i < (largo - 1); i++) {
                resp_list.splice(i*2 +1, 0, ' ');
                console.log(resp_list);
            }
            try {
                console.log('Tiene doble espacio if')
                let resp_list_copy = structuredClone(resp_list);
                resp_list_copy.splice(-4, 0, ' ');
                console.log(resp_list_copy);
                // const resp_list_more_spaces = resp_list.toSplice(-2, 0, ' ');
                const resp_more_spaces = resp_list_copy.join('');
                // const resp_more_spaces = resp_list_more_spaces.join(' ');
                console.log(resp_more_spaces);
                resp = await getOptionValue(elem_4, resp_more_spaces);
            } catch(e) {
                console.log('No era espacio doble entre nombre y apellido')
                not_double_name_lastname = true;
            }
        }
        
        // console.log(resp_list);
        let not_double_lastnames = false;
        if (not_double_name_lastname) {
            try {
                console.log('Tiene doble espacio en otro lado')
                let resp_list_copy = structuredClone(resp_list);
                resp_list_copy.splice(-2, 0, ' ');
                console.log(resp_list_copy);
                const resp_more_spaces = resp_list_copy.join('');
                console.log(resp_more_spaces);
                resp = await getOptionValue(elem_4, resp_more_spaces);
            } catch(e) {
                console.log('No era espacio doble entre apellidos');
                not_double_lastnames = true;
            }
        }

        let not_double_both = false;
        if (not_double_lastnames) {
            try {
                console.log('Tiene doble espacio en otro lado')
                let resp_list_copy = structuredClone(resp_list);
                resp_list_copy.splice(-4, 0, ' ');
                resp_list_copy.splice(-2, 0, ' ');
                console.log(resp_list_copy);
                const resp_more_spaces = resp_list_copy.join('');
                console.log(resp_more_spaces);
                resp = await getOptionValue(elem_4, resp_more_spaces);
            } catch(e) {
                console.log('No era espacio doble entre apellidos');
                not_double_both = true;
            }
        }

        let not_tab_name_lastname = false;
        if (not_double_both) {
            try {
                console.log('Tiene tab en algun lado')
                let resp_list_copy = structuredClone(resp_list);
                resp_list_copy.splice(-4, 0, '\t');
                console.log(resp_list_copy);
                const resp_more_spaces = resp_list_copy.join('');
                console.log(resp_more_spaces);
                resp = await getOptionValue(elem_4, resp_more_spaces);
            } catch(e) {
                console.log('No era tab entre nombre y apellidos')
                not_tab_name_lastname = true;
            }
        }

        // let not_tab_lastnames = false;
        if (not_tab_name_lastname) {
            try {
                console.log('Tiene doble espacio en otro lado')
                let resp_list_copy = resp_list;
                resp_list_copy.splice(-2, 0, '\t');
                console.log(resp_list_copy);
                const resp_more_spaces = resp_list_copy.join('');
                console.log(resp_more_spaces);
                resp = await getOptionValue(elem_4, resp_more_spaces);
            } catch(e) {
                console.log('No era tab con espacio entre apellidos')
                await browser.close();
                await response.status(500);
                await response.send(`No se pudo ejecutar la automatización. Error: ${e.message}. Responsable no encontrado.`) 
            }
        }

        await page.waitForNetworkIdle();
        await frame.select('#ddlResponsableTecnico', resp);
        await page.waitForNetworkIdle();

        console.log('Responsable ok')

        await frame.type('#txtDescripcion', description);

        await frame.$eval('input[id=calendarioFechaEvento]', (el, d) => el.value = d, date);

        console.log('Descripcion ok')
        await Promise.all([
            page.waitForNetworkIdle(),
            frame.click('#btnGuardar')
        ]);
    }
    catch(e){
        await browser.close();
        await response.status(500);
        await response.send(`No se pudo ejecutar la automatización. Error: ${e.message}`) 
    }
    finally{
        await browser.close();
        await response.status(200);
        await response.send(`Success`)
    }
};

// Start the server
app.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port}`)
})