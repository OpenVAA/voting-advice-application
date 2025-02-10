import json

def load_data(file_path: str) -> list:
    """Load data from a JSON or text file."""
    with open(file_path, "r") as file:
        if file_path.endswith(".json"):
            return json.load(file)
        else:
            return [line.strip() for line in file.readlines()]

def save_data(data: dict, file_path: str) -> None:
    """Save data to a JSON file."""
    with open(file_path, "w") as file:
        json.dump(data, file, indent=4)