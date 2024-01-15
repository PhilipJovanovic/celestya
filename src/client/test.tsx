'use client'

const client: React.FC = () => {
    console.log("rendered at client?")
    const handleClick = async (e: any) => {
        console.log("Client click")
    }

    return (
        <p onClick={handleClick}>
            Client
        </p>
    )
}

export default client