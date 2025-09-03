import React from 'react'
import PouchGrid from './PouchGrid'

function App() {
  return (
    <div className="flex flex-col justify-center text-center w-full">

      <h1 className='pt-5'>Tarkov Guess3r</h1>
      <p>Try to guess the pouch content</p>
      <p></p>
      <div className=' my-3 w-lg m-auto'>
        <PouchGrid></PouchGrid>
      </div>
    </div>
  )
}

export default App