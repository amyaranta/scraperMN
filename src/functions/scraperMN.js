import puppeteer from 'puppeteer';
// import puppeteer from 'puppeteer-core';
// import chromium from "@sparticuz/chromium";
import { app } from '@azure/functions';

app.http('scraperMN', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);
        const { username, password, project, name, lastname_1, lastname_2, type_intervention, date, type_event, event_caracter, responsible, description } = request.params;
        
        // context.log(request);
        // context.log(request.params);
        // context.log(username, password, project, name, lastname_1, lastname_2, type_intervention, date, type_event, event_caracter, responsible, description);

        const url = 'https://www.sis.mejorninez.cl/';
        context.log('Pase por aca')
        const result = await scraper(context, url, username, password, project, name, lastname_1, lastname_2, type_intervention, date, type_event, event_caracter, responsible, description);

        return result;

        // res.send('Data received successfully!');
    }
});

async function setUpPageDefaults(page) {
    await Promise.all([
      page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36"
      ),
      page.setExtraHTTPHeaders({
        "Accept-Language": "es-CL,es;q=0.9,en;q=0.8",
      }),
      page.setViewport({ width: 1280, height: 800 }),
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

// module.exports = 
async function scraper(context, url, username, password, project, name, lastname_1, lastname_2, type_intervention, date, type_event, event_caracter, responsible, description) {
    context.log('Pase por aca')
    let browser;

    try{
        // const path = await chromium.executablePath();
        // context.log(path);
        browser = await puppeteer.launch({
        headless: false,
        args: [
            // ...chromium.args,
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--single-process",
            "--no-zygote",
            "--disable-blink-features=AutomationControlled",
        ],
        executablePath: "/opt/homebrew/bin/chromium",
        // executablePath: await chromium.executablePath(),
        defaultViewport: {
            width: 1920,
            height: 1080,
        },
    });
    }
    catch(e){
        return context.res = {
            status: 500,            
            body: `Failed to execute web automation. Error message: ${e.message}`
        }  
    }

    try{
        const page = await browser.newPage();
        setUpPageDefaults(page);

        await page.goto(url);
        context.log('Pase por aca')
        // Landing page
        await page.type('#usuario', username);
        await page.type('#password', password);

        await Promise.all([
            page.waitForNavigation({waitUntil: 'networkidle2'}),
        page.click('#ingresar')
        ]);

        // Check if the is a pop up in home page
        // page.waitForNetworkIdle();

        // const close_button = await page.waitForSelector('.close');
        // if (close_button) {
        //     page.click('.close')
        // }

        // page.waitForNetworkIdle();
        // await new Promise(res => setTimeout(res, 1000));

        // Home select from navbar
        page.click('#menu_colgante_menu_menu');
        // const menu = await page.waitForSelector('xpath///a[contains(text(), "Menú")]');
        // await menu.click();
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

        const elem_proj = await page.waitForSelector('#ddown002');
        const proj = await getOptionValue(elem_proj, project.toUpperCase());
        await page.waitForNetworkIdle();
        await page.select('#ddown002', proj);
        await page.waitForNetworkIdle();

        await Promise.all([
        page.waitForNetworkIdle(),
        page.click('#btnbuscar')
        ]);

        let select_kid;
        await Promise.all([
        page.waitForNetworkIdle(),
        select_kid = await page.waitForSelector('xpath///a[contains(text(), "Seleccionar")]'),
        await select_kid.click()
        ]);
        context.log('Pase por aca')

        await new Promise(res => setTimeout(res, 1000));

        await Promise.all([
        page.waitForNetworkIdle(),
        await page.click('#wib004')
        ]);

        await page.waitForNetworkIdle();

        context.log('Pase por aca')
        // Pop up, add new 'Evento de Intervención'
        const frame = page
            .frames()
            .find((f) => f.url().includes("eventos_intervencion"));

        if (!frame) throw new Error("Frame not found");
        context.log('Pase por aca')

        await Promise.all([
            page.waitForNetworkIdle(),
            await frame.click('#btnAgregar')
        ]);

        // Add new Evento de Intervención
        await page.waitForNetworkIdle();

        const elem = await frame.waitForSelector('#ddlTipoIntervencion');
        const type_int = await getOptionValue(elem, type_intervention.toUpperCase());

        await page.waitForNetworkIdle();
        await frame.select('#ddlTipoIntervencion', type_int);
        await page.waitForNetworkIdle();

        // context.log(elem)
        context.log('Pase por aca')

        // await new Promise(res => setTimeout(res, 1000));

        const elem_2 = await frame.waitForSelector('#ddlTipoEvento');

        // context.log(elem_2)
        context.log('Pase por aca')

        // const content = await frame.content()
        // context.log(content)

        // await new Promise(res => setTimeout(res, 1000));

        const type_ev = await getOptionValue(elem_2, type_event.toUpperCase());
        
        context.log('Pase por aca')

        await page.waitForNetworkIdle();
        await frame.select('#ddlTipoEvento', type_ev);
        await page.waitForNetworkIdle();

        context.log('Pase por aca')

        const elem_3 = await frame.waitForSelector('#ddlCaracterEvento');
        const ev_car = await getOptionValue(elem_3, event_caracter.toUpperCase());
        
        context.log('Pase por aca')

        await page.waitForNetworkIdle();
        await frame.select('#ddlCaracterEvento', ev_car);
        await page.waitForNetworkIdle();

        context.log('Pase por aca')
        const elem_4 = await frame.waitForSelector('#ddlResponsableTecnico');
        const resp = await getOptionValue(elem_4, responsible.toUpperCase());
        
        await page.waitForNetworkIdle();
        await frame.select('#ddlResponsableTecnico', resp);
        await page.waitForNetworkIdle();

        context.log('Pase por aca')

        await frame.type('#txtDescripcion', description);

        await frame.$eval('input[id=calendarioFechaEvento]', (el, d) => el.value = d, date);

        context.log('Pase por aca')
        await Promise.all([
            page.waitForNetworkIdle(),
            frame.click('#btnGuardar')
        ]);
    }
    catch(e){
        await browser.close();
        return context.res = {
            status: 500,            
            body: `Failed to execute web automation. Error message: ${e.message}`
        }  
    }
    finally{
        await browser.close();
        return context.res = {
        status: 200,            
        body: `Success`
        } 
    }
};
