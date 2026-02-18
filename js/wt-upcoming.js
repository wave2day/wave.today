(async function(){

const slot = document.getElementById("wtUpcomingSlot");
if(!slot) return;

try{
    const res = await fetch("data/upcoming.json",{cache:"no-store"});
    if(!res.ok) return;

    const data = await res.json();
    const ev = Array.isArray(data) ? data[0] : data.events?.[0];
    if(!ev) return;

    const d = new Date(ev.date);
    const day = String(d.getDate()).padStart(2,"0");
    const mon = d.toLocaleString("en-US",{month:"short"}).toUpperCase();

    slot.innerHTML = `
        <div>
            <a class="wtPosterLink" href="${ev.link || "#"}" target="_blank">
                <img class="wtPoster" src="${ev.image || ev.poster}" alt="">
            </a>

            <div class="wtWhiteLabel">
                <div class="wtLabelHit"></div>
                <div class="wtDay">${day}</div>
                <div class="wtMonth">${mon}</div>
            </div>
        </div>
    `;

}catch(e){
    console.log(e);
}

})();

document.addEventListener("click", function(e){
    if(e.target.closest(".wtWhiteLabel")){
        e.preventDefault();
        e.stopPropagation();
    }
}, true);
