import React, { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Download, Heart, Send, Trash2 } from 'lucide-react'

const App = () => {
  const [sessionId,setSessionId] = useState(()=>{
    let savedId = localStorage.getItem('session_id');
    if(!savedId){
      savedId = crypto.randomUUID();
      localStorage.setItem('session_id',savedId);
    }
    return savedId;
  });
  const [likedIndex, setLikedIndex] = useState(()=>{
    const saved = localStorage.getItem('userLikes');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentIdx, setCurrentIdx] = useState(0);
  const [imgData,setImgData] = useState([]);
  const [error,setError] = useState('');
  const [deleteModel,setDeleteModel] = useState(false);

  const containerRef = useRef(null);
  const syncedIndices = useRef(new Set());
  const pendingBuffer = useRef([]);
  
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

  // console.log(sessionId);
  
  const images = [
    "tt0084058.jpg",
    "tt0084867.jpg",
    "tt0085121.jpg"
  ];

  const category =[
    "Love , Drama",
    "Funny , Horror",
    "Romance"
  ]

  const colorMap = {
    blue: 'bg-blue-600/40 border-blue-800 ',
    amber: 'bg-amber-600/40 border-amber-800',
    slate: 'bg-slate-600/40 border-slate-800',
    yellow: 'bg-yellow-600/40 border-yellow-800',
    white:'bg-white/30 border-gray-400'
  };

  const shuffledColorKeys = React.useMemo(() => {
    const keys = Object.keys(colorMap);
    const arr = [...keys];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  useEffect(()=>{
    localStorage.setItem('userLikes',JSON.stringify(likedIndex));
  },[likedIndex])

  const toggleLike = (index) =>{
    const item = imgData[index];

    setLikedIndex((prev) =>{
      const isAlreadyLiked = prev.some((liked) => liked.id === item.id);

      let newLikes;

      if (isAlreadyLiked){
        newLikes = prev.filter((liked)=> liked.id !== item.id); 

        pendingBuffer.current.push({
          session_id: sessionId,
          movie_id: item.id,
          liked: 0
        });
        syncWithBackend(true);

      }else{
        newLikes = [...prev, { id: item.id, name: item.poster_url.split('.')[0], category: item.genre_list }];

        pendingBuffer.current.push({
          session_id: sessionId,
          movie_id: item.id,
          liked: 1
        });
        syncedIndices.current.add(index); 
        syncWithBackend(true);
      }
      return newLikes
    })
  }

  const syncWithBackend = async(forceRefresh = false)=>{
    if(pendingBuffer.current.length === 0) return;

    const payload = {interactions:[...pendingBuffer.current]};
    pendingBuffer.current = []

    try{
      await fetch(`${BACKEND_URL}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const triggerThreshold = Math.floor(imgData.length * 0.8);

      if(forceRefresh || (currentIdx >= triggerThreshold && imgData.length > 0)){

        const limit = forceRefresh ? 10 : 20

        const res = await fetch(`${BACKEND_URL}/feed?session_id=${sessionId}&limit=${limit}`);
        const freshRecommendations = await res.json();
        setImgData(prev =>{
          const seenIds = new Set(prev.slice(0,currentIdx + 1).map(m => m.id));
          const uniqueNew = freshRecommendations.filter(m => !seenIds.has(m.id));
          return [...prev.slice(0,currentIdx+1),...uniqueNew];
        })
      }

    }catch(error){
      console.error('Sync Pitfall : ',error);
      
    }
  }

  const scrollIdx = (index) => {
    if (index < 0 || index >= imgData.length) return;

    if (containerRef.current) {
      const vh = containerRef.current.offsetHeight;
      containerRef.current.scrollTo({
        top: index * vh,
        behavior: 'smooth'
      });
      setCurrentIdx(index);
    }
  };

  const handleScroll = () => {

    if (!containerRef.current) return;

    const {scrollTop,offsetHeight} = containerRef.current;
    const newIdx = Math.round(scrollTop/offsetHeight);
    if(newIdx !== currentIdx){
      if(!syncedIndices.current.has(currentIdx)){
        const movie = imgData[currentIdx];

        if(movie){
          const isLiked = likedIndex.some(l => l.id === movie.id);
          pendingBuffer.current.push({
            session_id: sessionId,
            movie_id: movie.id,
            liked: isLiked ? 1 : 0
          });

          console.log(`Log: Movie ${movie.id} marked as ${isLiked ? 'LIKE' : 'SKIP'}`);

        }
        syncedIndices.current.add(currentIdx);

        if(pendingBuffer.current.length >= 5){
          syncWithBackend();
        }
      }
      setCurrentIdx(newIdx);
    }
    // if (containerRef.current) {
    //   const { scrollTop, offsetHeight } = containerRef.current;
    //   const newIndex = Math.round(scrollTop / offsetHeight);
    //   if (newIndex !== currentIdx) {
    //     setCurrentIdx(newIndex);
    //   }
    // }
  };

  const handleDownload = async(filename) => {
    try{
      const res = await fetch(`${BACKEND_URL}/download/${filename}`);

      if(!res.ok) throw new Error("Download Failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download',filename);
      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    }catch(error){
      console.error("Download : ",error);
    }
  }

  const getImage = async() => {
    const today = new Date().toLocaleDateString();
    const savedData = localStorage.getItem('daily_feed');
    const savedDate = localStorage.getItem('feed_date');

    if (savedData && savedDate === today) {
      const parsed = JSON.parse(savedData);
      if (parsed.length > 0) {
        setImgData(parsed);
        return;
      }
    }

    try {
      const res = await fetch(`${BACKEND_URL}/feed?session_id=${sessionId}`);

      if(!res.ok) throw new Error("Failed to fetch Data");

      const data = await res.json();
      setImgData(data);
      localStorage.setItem('daily_feed',JSON.stringify(data));
      localStorage.setItem('feed_date',today);      
    } catch (error) {
      console.error('Error Fetching Feed : ',error);
      setError('Currently Server is Down or :',error)
    }
  }

  useEffect(() => {
    getImage();
  }, []);

  return (
    <div className="relative w-full h-dvh bg-black overflow-hidden">
      {deleteModel && (
        <div className='fixed inset-0 z-200 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 '>
          <div className='bg-zinc-950 border border-gray-700/70 p-4 rounded-xl mzx-w-sm w-full shadow-2xl'
          >
            <h2 className="text-white text-xl font-bold mb-2">Are you sure?</h2>
            <p className="text-zinc-400 mb-6"> This will reset your feed and clear all your likes. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModel(false)}
                className="px-4 py-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="bg-red-800 border border-red-900/70 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-all active:scale-95 cursor-pointer"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. FIXED CONTROLS (Moved outside the scrollable div) */}
      <div className='fixed z-100 hidden sm:flex flex-col justify-center items-center gap-5 right-10 top-1/2 -translate-y-1/2'>
        <ChevronUp
          onClick={() => scrollIdx(currentIdx - 1)}
          className={`rounded-full border border-gray-400 h-12 w-12 p-2 text-white cursor-pointer hover:bg-white/10 transition-all ${currentIdx === 0 ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}
        />
        <ChevronDown
          onClick={() => scrollIdx(currentIdx + 1)}
          className={`rounded-full border  border-gray-400 h-12 w-12 p-2 text-white cursor-pointer hover:bg-white/10 transition-all ${currentIdx === imgData.length - 1 ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}
        />
      </div>

      <div className='absolute text-white  gap-2 flex right-5 top-5 items-center bg-red-400/20 cursor-pointer p-2 rounded-full px-4 border border-red-900 z-100 font-semibold hover:scale-101'
      onClick={()=>setDeleteModel(true)}
      >
        <Trash2 />
        <p className='hidden sm:flex'> Delete stored data</p>
      </div>

      <div
        className="main w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        ref={containerRef}
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // Hides scrollbar for Firefox/IE
      >
        {/* HEADER */}
        <div className='absolute sm:bg-transparent w-[90%] z-50 m-5  -translate-x-1/2 left-1/2 sm:left-0 sm:translate-x-0 rounded'
        onClick={()=>scrollIdx(0)}
        >
          <p className='font-rogbold text-white text-3xl select-none '>FEED</p>
        </div>

        {imgData.map((item, index) => (
          <div
            key={item.id}
            className="w-full h-dvh snap-start snap-always flex flex-col text-center relative overflow-hidden"
          >
            <div className='flex-1 w-full flex flex-col lg:flex-row md:flex-row sm:flex-row md:justify-center items-center relative gap-5'>
              <img

                src={`${BACKEND_URL}/images/${item.poster_url}`}

                alt=""

                className="w-[95%] h-[70%] object-cover md:h-[85vh] md:w-auto md:max-w-[90%] md:rounded-lg md:object-contain  md:translate-y-0 transform translate-y-[15%] select-none"

              />

              <div className='absolute top-[85%]  left-4  text-white z-20 text-xl font-poppins flex gap-2 items-center'>
                {/* <p className='text-start sm:hidden'>Category : </p> */}
                {/* <p className='text-xl'>Category</p> */}
                <p className={`text-xl py-2 px-6 rounded-2xl border text-center ${colorMap[shuffledColorKeys[index % shuffledColorKeys.length]]}`}>
                  {item.genre_list}
                </p>
              </div>

              <div className='flex flex-col items-end gap-5 absolute md:static right-[8%] -translate-y-1/2 top-1/2 bg-black/80 p-2 rounded-full z-30'>
                <Heart
                  onClick={() => toggleLike(index)}
                  className={`w-8 h-8 cursor-pointer transition-all active:scale-125 
                  ${likedIndex.some(liked => liked.id === item.id)? 'text-red-500 fill-red-500' : 'text-white fill-transparent'}`}
                />
                <Download className="w-8 h-8 text-white cursor-pointer"
                onClick={()=>handleDownload(item.poster_url)}
                />
                <Send className="w-8 h-8 text-white cursor-pointer" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App