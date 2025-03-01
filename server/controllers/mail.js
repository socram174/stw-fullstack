export const addSubscriber = async (req, res) => {
    try {
        res.status(200).json({message: "Add new subscriber"});
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}

export const notifySubscribers = async (req, res) => {
    //const {date} = req.body;
    try {
        res.status(200).json({message: "Notify everyone"});
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}
export const getSubscribers = async (req, res) => {
    //const {date} = req.body;
    try {
        res.status(200).json({message: "Get subscribers"});
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
}