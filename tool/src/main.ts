import html2canvas from "html2canvas"

//variables and constants.
const black_coordinates = new Set([
    '[5,12]','[5,13]','[5,14]','[5,15]','[5,16]','[6,10]','[6,11]','[6,17]','[6,18]',
    '[7,9]','[7,19]','[8,8]','[8,20]','[9,7]','[9,21]','[10,7]','[10,21]','[11,6]',
    '[12,6]','[13,6]','[14,6]','[15,6]','[11,22]','[12,22]','[13,22]','[14,22]','[15,22]',
    '[11,13]','[12,13]','[13,13]','[13,12]','[14,13]','[14,12]','[11,18]','[12,18]',
    '[13,18]','[13,17]','[14,18]','[14,17]','[16,7]','[17,7]','[16,21]','[17,21]',
    '[18,8]','[19,9]','[18,20]','[19,19]','[20,10]','[20,11]','[20,12]','[20,17]','[20,18]',
    '[20,19]','[21,13]','[21,14]','[21,15]','[21,16]','[21,9]','[21,20]','[22,8]',
    '[22,21]','[23,7]','[24,7]','[23,22]','[24,22]','[25,6]','[26,6]','[27,6]','[25,23]',
    '[26,23]','[27,23]','[28,7]','[29,7]','[28,22]','[29,22]','[27,8]','[26,9]','[25,9]',
    '[27,21]','[26,20]','[25,20]'

]);

const colors = [
    '#8cffde',
    '#45b8b3',
    '#839740',
    '#c9ec85',
    '#46c657',
    '#158968',
    '#2c5b6d',
    '#222a5c',
    '#566a89',
    '#8babbf',
    '#cce2e1',
    '#ffdba5',
    '#ccac68',
    '#a36d3e',
    '#683c34',
    '#000000',
    '#38002c',
    '#663b93',
    '#8b72de',
    '#9cd8fc',
    '#5e96dd',
    '#3953c0',
    '#800c53',
    '#c34b91',
    '#ff94b3',
    '#bd1f3f',
    '#ec614a',
    '#ffa468',
    '#fff6ae',
    '#ffda70',
    '#f4b03c',
    '#ffffff',
    ]

const container = document.querySelector('.container') as HTMLElement;
const reset = document.querySelector('.reset') as HTMLElement;
const pen_option = document.querySelector('.pen') as HTMLElement;
const bucket_option = document.querySelector('.bucket') as HTMLElement;
const eraser_option = document.querySelector('.eraser') as HTMLElement;
const palette_container = document.querySelector('.colors') as HTMLElement;
const root = document.documentElement;
const downloadButton = document.querySelector('.download') as HTMLElement;



var next = '#d7dadb';
var mat:Array<Array<HTMLElement>> = [] 

var curr_color:HTMLElement = document.createElement('div');
curr_color.style.backgroundColor = 'rgb(140, 255, 222)'

var prev_color:HTMLElement = document.createElement('div');
prev_color.style.backgroundColor = 'rgb(140, 255, 222)'

var curr_mode:HTMLElement = pen_option;
var prev_mode:HTMLElement = pen_option;
let isDrawing:boolean = false;

var initial_colors = new Map<HTMLElement, string>();
var divToCoordsMap = new Map<HTMLElement,Array<number>>();
var snapshots:Array<string> = []; 


//utility functions

//resetting the grid
function reset_grid(){
    var next = '#d7dadb';
    for (let i = 0; i < 30; i++) {
        
        
        mat[i][0].style.backgroundColor = next;

        for (let j = 1; j < 30; j++) {
            if(next === '#f5f5f5'){next = '#d7dadb'}
            else{ next = '#f5f5f5'}

            mat[i][j].style.backgroundColor = next;

            if (black_coordinates.has(`[${i},${j}]`)){
                mat[i][j].style.backgroundColor = 'black';
            }
        }
    }
}

//using a snapshot
function from_snapshot(){

    try{
        for (let i = 0; i < 30; i++) {
            for (let j = 0; j < 30; j++) {
                const div = mat[i][j];
                div.style.backgroundColor = snapshots[snapshots.length-1]
            }
        }
    }catch(e){
        console.log('no undo available.')
    }
}

//drawing the pixel
function draw_pixel(pixel:HTMLElement){
    pixel.style.backgroundColor = curr_color.style.backgroundColor
}

//erasing a pixel
function erase_pixel(pixel:HTMLElement){
    pixel.style.backgroundColor = initial_colors.get(pixel)!;
}
function bucketFill(clickedDiv: HTMLElement) {
    const clickedColor = clickedDiv.style.backgroundColor;
    const newColor = curr_color.style.backgroundColor
    
    if (clickedColor === newColor) {
      return;
    }
    
    const visitedDivs = new Set<HTMLElement>();
    const fillAdjacent = (div: HTMLElement) => {
      if (!visitedDivs.has(div)) {
        visitedDivs.add(div);
        
        console.log(clickedColor,div.style.backgroundColor)


        const coords = divToCoordsMap.get(div)!;
        const topDiv = coords[0] > 0 ? mat[coords[0] - 1][coords[1]] : null;
        const bottomDiv = coords[0] < mat.length - 1 ? mat[coords[0] + 1][coords[1]] : null;
        const leftDiv = coords[1] > 0 ? mat[coords[0]][coords[1] - 1] : null;
        const rightDiv = coords[1] < mat[0].length - 1 ? mat[coords[0]][coords[1] + 1] : null;
        
        if (div.style.backgroundColor === clickedColor) {

            div.style.backgroundColor = newColor;
            if (topDiv) fillAdjacent(topDiv);
            if (bottomDiv) fillAdjacent(bottomDiv);
            if (leftDiv) fillAdjacent(leftDiv);
            if (rightDiv) fillAdjacent(rightDiv);

        }else if(['rgb(215, 218, 219)','rgb(245, 245, 245)'].includes(clickedColor) && ['rgb(215, 218, 219)','rgb(245, 245, 245)'].includes(div.style.backgroundColor)){

            div.style.backgroundColor = newColor;
            if (topDiv) fillAdjacent(topDiv);
            if (bottomDiv) fillAdjacent(bottomDiv);
            if (leftDiv) fillAdjacent(leftDiv);
            if (rightDiv) fillAdjacent(rightDiv);

        }
      }
    }
    
    fillAdjacent(clickedDiv);
  }

//initialization
function main(){
    
    //setting up grid for first time and adding event listeners
    
    for (let i = 0; i < 30; i++) {
        const div = document.createElement('div');

	    container.appendChild(div);
        div.style.backgroundColor = next;
        
        initial_colors.set(div, next);
        divToCoordsMap.set(div,[i,0])

        if (black_coordinates.has(`[${i},0]`)){
            div.style.backgroundColor = 'black';
        }
        mat.push([])
        mat[i].push(div);


        
        for (let j = 1; j < 30; j++) {
            
            if(next === '#f5f5f5'){next = '#d7dadb'}
            else{ next = '#f5f5f5'}

            const div = document.createElement('div');
            container.appendChild(div);
            div.style.backgroundColor = next;
            
            initial_colors.set(div, next);
            divToCoordsMap.set(div,[i,j])


            if (black_coordinates.has(`[${i},${j}]`)){
                div.style.backgroundColor = 'black';
            }
            
            mat[i].push(div)
        }
    }


    //setting up color picker
    for (let i = 0; i<32 ; i++){
        const div = document.createElement('div');
	    palette_container.appendChild(div);
        div.style.backgroundColor = colors[i];

        if (i === 0){
            div.classList.add('first-color')
        }


        div.addEventListener('click',()=>{

            if (curr_color === div){
                return
            }

            prev_color = curr_color;
            curr_color = div;

            root.style.setProperty('--hover-color', div.style.backgroundColor);

        })
    }


    //changing modes
    pen_option.addEventListener('click',()=>{

        if (curr_mode === pen_option){
            return
        }
        
        prev_mode = curr_mode;
        curr_mode = pen_option;

        pen_option.classList.add('chosen');
        prev_mode.classList.remove('chosen')

    })
    
    bucket_option.addEventListener('click',()=>{

        if (curr_mode === bucket_option){
            return
        }

        prev_mode = curr_mode;
        curr_mode = bucket_option;

        bucket_option.classList.add('chosen');
        prev_mode.classList.remove('chosen')

    })
    
    eraser_option.addEventListener('click',()=>{

        if (curr_mode === eraser_option){
            return
        }

        prev_mode = curr_mode;
        curr_mode = eraser_option;

        eraser_option.classList.add('chosen');
        prev_mode.classList.remove('chosen')

        root.style.setProperty('--hover-color', 'rgba(255,255,255,0.3)');

    })


  
    // Add mousedown event listener
    container.addEventListener("mousedown", (e) => {
      isDrawing = true;
      const current_div = e.target as HTMLElement

      if (curr_mode === pen_option){
        draw_pixel(current_div);
      }else if (curr_mode === eraser_option){
        erase_pixel(current_div);
      }else{
        bucketFill(current_div);
      }
    });
  
    // Add mousemove event listener
    container.addEventListener("mousemove", (e) => {
      if (isDrawing) {
        console.log('dragging');
        const current_div = e.target as HTMLElement
        
        if (curr_mode === pen_option){
            draw_pixel(current_div);
          }else if (curr_mode === eraser_option){
            erase_pixel(current_div);
          }
      }
    });
  
    // Add mouseup event listener
    container.addEventListener("mouseup", () => {
        console.log('out from mouseup');
        isDrawing = false;
    });
  


    //resetting canvas
    reset.addEventListener('click',reset_grid);

    //adding download capability

    downloadButton.addEventListener('click', async () => {
        
        for (var i=0 ; i<30; i++){
            for (var j=0; j<30; j++){
                console.log('fading')
                const div = mat[i][j];
                if (['rgb(215, 218, 219)','rgb(245, 245, 245)'].includes(div.style.backgroundColor)){
                    div.style.backgroundColor = 'rgba(0,0,0,0)';
                }
            }
        }
        
        const canvas = await html2canvas(container!);
        const dataURL = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = dataURL;
        link.click();
        link.target = '_blank';

        for (var i=0 ; i<30; i++){
            for (var j=0; j<30; j++){
                console.log('resetting')
                const div = mat[i][j];
                console.log(div.style.backgroundColor);
                if (['rgba(0, 0, 0, 0)'].includes(div.style.backgroundColor)){
                    div.style.backgroundColor = initial_colors.get(div)!
                }
            }
        }

      });


}






window.onload = ()=>{
    main()
}