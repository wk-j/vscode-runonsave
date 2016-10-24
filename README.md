## Run saved file in Terminal

Fork from [vscode-runonsave](https://github.com/emeraldwalk/vscode-runonsave)

Simplify original extension by pass command into Terminal directly without spawn process, so we don't lose output colors. 

![](https://github.com/wk-j/vscode-save-and-run/raw/master/images/save-and-run.png)

## Features

- Configure multiple commands that run when a file is saved
- Regex pattern matching for files that trigger commands running

## Note

- Commands only get run when saving an existing file. Creating new files, and Save as... don't trigger the commands.

## Configuration

Add "saveAndRun" configuration to user or workspace settings.

- "commands" - array of commands that will be run whenever a file is saved.
  - "match" - a regex for matching which files to run commands on
  - "cmd" - command to run. Can include parameters that will be replaced at runtime (see Placeholder Tokens section below).

## Sample Config

```json
"saveAndRun": {
	"commands": [
		{
			"match": ".*",
			"cmd": "echo 'I run for all files.'"
		},
		{
			"match": "\\.txt$",
			"cmd": "echo 'I am a .txt file ${file}.'"
		}
	]
}
```

## Commands

The following commands are exposed in the command palette

- `Save and Run : Enable`
- `Save and Run : Disable`

## Placeholder Tokens

Commands support placeholders similar to tasks.json.

- `${workspaceRoot}`: workspace root folder
- `${file}`: path of saved file
- `${fileBasename}`: saved file's basename
- `${fileDirname}`: directory name of saved file
- `${fileExtname}`: extension (including .) of saved file
- `${fileBasenameNoExt}`: saved file's basename without extension
- `${cwd}`: current working directory

### Environment Variable Tokens

- `${env.Name}`

## License

[Apache](https://github.com/wk-j/vscode-save-and-run/blob/master/LICENSE)