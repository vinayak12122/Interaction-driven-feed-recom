import React, { useEffect, useState } from 'react'

const ShareModel = ({onClose}) => {
    const [showTxt, setShowTxt] = useState(false);
    const [progress, setProgress] = useState(0);
    const [copied, setCopied] = useState(false);
    const shareableLink = "https://feed-three-sand.vercel.app";


    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => (prev < 100 ? prev + 1 : 100));
        }, 10);

        return () => clearInterval(interval);
    }, []);

    useEffect(()=>{
        if(progress === 100){
            const timer = setTimeout(()=>{
                setShowTxt(true);
            },200);
            return () => clearTimeout(timer);
        }
    },[progress])

    const handleCopy = () =>{
        navigator.clipboard.writeText(shareableLink);
        setCopied(true);

        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div
        onClick={onClose}
            className='fixed inset-0 z-200 flex items-center justify-center text-white bg-black/60 backdrop-blur-sm p-4 font-poppins'
        >
            <div className='bg-zinc-950 border border-gray-700/70 p-4 rounded-xl mzx-w-sm w-full sm:max-w-xl shadow-2xl text-center'
                onClick={(e) => e.stopPropagation()} 
            >
                {/* {!showTxt &&
                    (
                        <div>
                            <p>Creating Sharable Link</p>
                            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-full transition-all duration-150 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )
                } */}

                <div className="animate-in fade-in duration-500 flex justify-between items-center gap-4 ">
                    <p className="text-blue-400 w-[90%] overflow-x-auto text-start whitespace-nowrap scrollbar-hide">{shareableLink}</p>
                    <button
                        onClick={handleCopy}
                        className={`text-xs text-white w-[20%] p-2 rounded cursor-pointer transition-all duration-300 ${copied ? 'bg-green-600' : 'bg-blue-700'
                            }`}
                    >
                        {copied ? "Done" : "Copy"}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ShareModel