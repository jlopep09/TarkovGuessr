import React from 'react'
import PouchGrid from './PouchGrid'

function App() {
  return (
    <div className='flex flex-col justify-center align-middle min-w-lvw text-center items-center'>

      <h1>Tarkov Guessr</h1>
      <p>Tarkov guessr is a game.</p>
      <p></p>
      <div className=' my-3 w-lg '>
        <PouchGrid></PouchGrid>
      </div>
    </div>
  )
}

export default App