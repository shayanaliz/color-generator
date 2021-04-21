window.FontAwesomeConfig = {
    searchPseudoElements: true
  }
//Global selections and variables
const colorDivs=document.querySelectorAll('.color');
const generateBtn=document.querySelector('.generate');
const sliders=document.querySelectorAll('input[type="range"]');
const currentHexes=document.querySelectorAll('.color h2');
const popUp=document.querySelector('.copy-container');
const adjustButton=document.querySelectorAll('.adjust');
const closeButton=document.querySelectorAll('.close-adjustment');
const sliderContainers=document.querySelectorAll('.sliders');
const lockButton=document.querySelectorAll('.lock');
const allButtons=document.querySelectorAll('button');
const libraryContainer=document.querySelector('.library-container');
const allContainers=document.querySelectorAll('.containers');
//This is for local storage
let savedPalettes=[];
let paletteHistory=[];

let initialColors;

//Event Listeners
sliders.forEach(slider=>{
    slider.addEventListener('input', hslControls)
})
colorDivs.forEach((div,index)=>{
    div.addEventListener('change',()=>{
        updateTextUI(index);
    })
})

currentHexes.forEach(hex=>{
    hex.addEventListener('click',()=>{
        copyToClipboard(hex);
    })
})
popUp.addEventListener('transitionend',()=>{
    const popUpBox=popUp.children[0];
    popUp.classList.remove('active');
    popUpBox.classList.remove('active');
})
adjustButton.forEach((button,index)=>{
    button.addEventListener('click',()=>{
        openAdjustmentPanel(index);
    })
})
closeButton.forEach((button,index)=>{
    button.addEventListener('click',()=>{
        closeAdjustmentPanel(index);
    })
})
generateBtn.addEventListener('click',randomColors);
document.addEventListener('keyup',event=>{
    if(event.code==='Space'){
        if(allContainers[0].classList.contains('active')===false&&
        allContainers[1].classList.contains('active')===false&&
        allContainers[2].classList.contains('active')===false){
        randomColors();
    }
    }
});
document.addEventListener('keydown', event=>{
    if (event.ctrlKey && event.key === 'z') {
      retrievePreviousPalette();
    }
});

lockButton.forEach((button,index)=>{
    button.addEventListener('click',e=>{
        lock(e,index);
    })
})

//blurring buttons
allButtons.forEach(btn=>{
    btn.addEventListener('focus',()=>{
        btn.blur();
    })
})

//Functions 

//Color Generator
function generateHex(){
    const hexColor=chroma.random();
    return hexColor;
}

function randomColors(){
    initialColors=[];

    colorDivs.forEach((div,index)=>{
        const hexText=div.children[0];
        const randomColor=generateHex();
        if(div.classList.contains('locked')){
            initialColors.push(hexText.innerText)
            return;
        }else{
            initialColors.push(chroma(randomColor).hex());
        };
        const icons=div.querySelectorAll('.controls button');

        //Add the color to background
        div.style.backgroundColor=randomColor;
        hexText.innerText=randomColor;  

        //check for contrast
        checkContrast(randomColor,hexText,icons);

        //Initial colorize sliders
        const color=chroma(randomColor);
        const sliders=div.querySelectorAll('.sliders input');
        const hue=sliders[0];
        const brightness =sliders[1];
        const saturation =sliders[2];
        hue.value=chroma(randomColor).get('hsl.h');
        brightness.value=chroma(randomColor).get('hsl.l');
        saturation.value=chroma(randomColor).get('hsl.s');
        colorizeSliders(color,hue,brightness,saturation);
        colorizeHueThumb(index,randomColor);
    });
    paletteHistory.push(initialColors);
}

function checkContrast(color, text, icons){
    const luminance=chroma(color).luminance();
    if(luminance>.5){
        for(icon of icons){
            icon.style.color='black';
        }
        text.style.color='black';
    }
    else{
        for(icon of icons){
            icon.style.color='white';
        }
        text.style.color='white';
    }      
}

function colorizeSliders(color,hue,brightness,saturation){
    //Scale Saturation
    const noSat=color.set('hsl.s',0);
    const fullSat=color.set('hsl.s',1);
    const scaleSat=chroma.scale([noSat,color,fullSat]);
    //Scale Brightness
    const midBright=color.set("hsl.l",0.5);
    const scaleBright=chroma.scale(["black",midBright,"white"]);

    // Update input colors
    saturation.style.backgroundImage=`linear-gradient(to right,${scaleSat(0)},${scaleSat(1)})`;
    brightness.style.backgroundImage=`linear-gradient(to right,${scaleBright(0)},${scaleBright(0.5)},${scaleBright(1)})`;
    hue.style.backgroundImage=`linear-gradient(to right,rgb(204,75,75),rgb(204,204,75),rgb(75,204,75),rgb(75,204,204),rgb(75,75,204),rgb(204,75,204),rgb(204,75,75))`
}

function hslControls(e){
    const index= e.target.getAttribute('data-bright') ||
    e.target.getAttribute('data-sat') ||
    e.target.getAttribute('data-hue');
    let sliders=e.target.parentElement.querySelectorAll('input[type="range"]');
    const hue=sliders[0];
    const brightness=sliders[1];
    const saturation=sliders[2];
    const bgColor=colorDivs[index].querySelector('h2').innerText;

    let color=chroma(initialColors[index])
    .set("hsl.s",saturation.value)
    .set("hsl.l",brightness.value)
    .set("hsl.h",hue.value);

    colorDivs[index].style.backgroundColor=color;

    //update slider colors
    colorizeSliders(color,hue,brightness,saturation);
    colorizeHueThumb(index,color);
}

function updateTextUI(index){
    const activeDiv=colorDivs[index];
    const color=chroma(activeDiv.style.backgroundColor);
    const textHex=activeDiv.querySelector('h2')
    const icons=activeDiv.querySelectorAll('.controls button');
    textHex.innerText=color.hex();

    //Check contrast
    checkContrast(color,textHex,icons);
}

function copyToClipboard(hex){
    const el=document.createElement('textarea');
    el.value=hex.innerText;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    //Copied pop-up
    const popUpBox=popUp.children[0];
    popUp.classList.add('active');
    popUpBox.classList.add('active');
}

function openAdjustmentPanel(index){
    sliderContainers[index].classList.toggle('active');
}
function closeAdjustmentPanel(index){
    sliderContainers[index].classList.remove('active');
}

//saturated color fill on hue thumb
function colorizeHueThumb(index,color){
    const r=document.querySelector(':root');
    const hueValue=Math.floor(chroma(chroma(color).hex()).get('hsl.h'));
    const hueColorConstruct=chroma({h:hueValue,s:1,l:0.5});
    r.style.setProperty(`--c${index}h`,hueColorConstruct);
}

function lock(e,index){
    console.log(e.target.innerHTML);
    if(e.target.innerHTML==='<svg class="svg-inline--fa fa-lock-open fa-w-18" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="lock-open" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M423.5 0C339.5.3 272 69.5 272 153.5V224H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48h-48v-71.1c0-39.6 31.7-72.5 71.3-72.9 40-.4 72.7 32.1 72.7 72v80c0 13.3 10.7 24 24 24h32c13.3 0 24-10.7 24-24v-80C576 68 507.5-.3 423.5 0z"></path></svg><!-- <i class="fas fa-lock-open"></i> -->'){
        e.target.innerHTML='<svg class="svg-inline--fa fa-lock fa-w-14" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="lock" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" data-fa-i2svg=""><path fill="currentColor" d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z"></path></svg><!-- <i class="fas fa-lock"></i> -->'
    }
    else{
        e.target.innerHTML='<svg class="svg-inline--fa fa-lock-open fa-w-18" aria-hidden="true" focusable="false" data-prefix="fas" data-icon="lock-open" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" data-fa-i2svg=""><path fill="currentColor" d="M423.5 0C339.5.3 272 69.5 272 153.5V224H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48h-48v-71.1c0-39.6 31.7-72.5 71.3-72.9 40-.4 72.7 32.1 72.7 72v80c0 13.3 10.7 24 24 24h32c13.3 0 24-10.7 24-24v-80C576 68 507.5-.3 423.5 0z"></path></svg><!-- <i class="fas fa-lock-open"></i> -->';
    }
    e.target.parentElement.parentElement.classList.toggle('locked');
}

//saving palettes and local storage
const saveBtn=document.querySelector('.save');
const submitSave=document.querySelector('.submit-save')
const closeSave=document.querySelector('.close-save')
const saveContainer=document.querySelector('.save-container')
const saveInput=document.querySelector('.save-name')
const libraryBtn=document.querySelector('.library')
const closeLibraryBtn=document.querySelector('.close-library')
//event listeners
saveBtn.addEventListener('click',openPalette);
closeSave.addEventListener('click',openPalette);
submitSave.addEventListener('click',savePalette);
libraryBtn.addEventListener('click',openLibrary);
closeLibraryBtn.addEventListener('click',closeLibrary);
libraryContainer.addEventListener('click',closeLibrary);


function openPalette(e){
    const popUp=saveContainer.children[0];
    saveContainer.classList.toggle('active');
    popUp.classList.toggle('active');
}
function savePalette(e){
    const popUp=saveContainer.children[0];  
    saveContainer.classList.toggle('active');
    popUp.classList.toggle('active');
    const name=saveInput.value;
    const colors=[];
    currentHexes.forEach(hex=>{
        colors.push(hex.innerText);
    })
    //Generate object
    let paletteNr=savedPalettes.length;
    const paletteObj={name: name,colors: colors, nr:paletteNr};
    savedPalettes.push(paletteObj);
    //save to local storage
    saveToLocal(paletteObj);
    saveInput.value='';
    generatePalette(paletteObj);
}

// function loadPalette()

function saveToLocal(paletteObj){
    let localPalettes;
    if(localStorage.getItem('palettes')===null){
        localPalettes=[];
    }else{
        localPalettes=JSON.parse(localStorage.getItem('palettes'));
    }
    localPalettes.push(paletteObj);
    localStorage.setItem('palettes',JSON.stringify(localPalettes));
}

function generatePalette(paletteObj){
    //Generate palette
    const palette=document.createElement('div');
    palette.classList.add('custom-palette');
    const title=document.createElement('h4');
    title.innerText=paletteObj.name;
    const palettePreview=document.createElement('div');
    palettePreview.classList.add('palette-preview');
    palettePreview.classList.add(paletteObj.nr);
    const preview=document.createElement('div');    
    preview.classList.add('small-preview');
    //event listener
    palettePreview.addEventListener('click',e=>{
        closeLibrary();
        const paletteIndex=e.target.classList[1];
        initialColors=[];
        savedPalettes[paletteIndex].colors.forEach((color,index)=>{
        generateColors(color,index);
        })      
    })
    paletteObj.colors.forEach(smallColor=>{
        const smallDiv=document.createElement('div');
        smallDiv.style.backgroundColor=smallColor;
        preview.appendChild(smallDiv);
    });

    //Append to library
    palette.appendChild(title);
    palettePreview.appendChild(preview);
    palette.appendChild(palettePreview);
    libraryContainer.children[0].appendChild(palette)
}

function openLibrary(){
    const popUp=libraryContainer.children[0];
    libraryContainer.classList.add('active');
    popUp.classList.add('active');
}
function closeLibrary(){
    const popUp=libraryContainer.children[0];
    libraryContainer.classList.remove('active');
    popUp.classList.remove('active');
}

function getPalettes(){
   if(localStorage.getItem('palettes')!==null){
        const localPalettes=JSON.parse(localStorage.getItem('palettes'));
        localPalettes.forEach(palette=>{
            const paletteObj={name:palette.name,colors:palette.colors,nr:palette.nr};
            savedPalettes.push(paletteObj);
            generatePalette(paletteObj);
        })
    }
}

function generateColors(color,index){
    initialColors.push(color);
    colorDivs[index].style.backgroundColor=color;
    colorDivs[index].children[0].innerText=color;
    updateTextUI(index);
    //colorize sliders
    const sliders=colorDivs[index].querySelectorAll('.sliders input');
    chromaColor=chroma(color);
    const hue=sliders[0];
    const brightness=sliders[1];
    const saturation=sliders[2];
    //set slider values
    hue.value=chroma(color).get('hsl.h');
    brightness.value=chroma(color).get('hsl.l');
    saturation.value=chroma(color).get('hsl.s');
    colorizeSliders(chromaColor,hue,brightness,saturation);
    colorizeHueThumb(index,chromaColor);
}

function retrievePreviousPalette(){
    const deletedHistory=paletteHistory.length-1;
    const previousPaletteIndex=paletteHistory.length-2;
    paletteHistory.splice(deletedHistory,1);
    const previousPalette=paletteHistory[previousPaletteIndex];
    previousPalette.forEach((color,index)=>{
        generateColors(color,index);
    })
}

getPalettes();

randomColors();